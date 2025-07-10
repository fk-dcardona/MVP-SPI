-- WhatsApp conversation tracking
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  message_sid TEXT UNIQUE,
  message_body TEXT,
  intent_type TEXT,
  intent_confidence NUMERIC,
  entities JSONB,
  execution_id UUID,
  response_sent BOOLEAN DEFAULT false,
  delivery_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent execution queue for async processing
CREATE TABLE IF NOT EXISTS agent_execution_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  priority INTEGER DEFAULT 5,
  context JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB,
  error TEXT
);

-- WhatsApp templates for notifications
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT UNIQUE NOT NULL,
  template_sid TEXT, -- Twilio template SID
  persona TEXT CHECK (persona IN ('streamliner', 'navigator', 'hub', 'spring', 'processor')),
  intent_type TEXT,
  template_body TEXT,
  variables JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- WhatsApp user preferences
CREATE TABLE IF NOT EXISTS whatsapp_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  phone_number TEXT NOT NULL,
  notifications_enabled BOOLEAN DEFAULT true,
  daily_digest_enabled BOOLEAN DEFAULT true,
  digest_time TIME DEFAULT '09:00:00',
  alert_notifications BOOLEAN DEFAULT true,
  min_alert_severity TEXT DEFAULT 'medium',
  language TEXT DEFAULT 'en',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON whatsapp_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created ON whatsapp_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_queue_status_priority ON agent_execution_queue(status, priority DESC);
CREATE INDEX IF NOT EXISTS idx_queue_created ON agent_execution_queue(created_at);

-- RLS policies
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_execution_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_preferences ENABLE ROW LEVEL SECURITY;

-- WhatsApp conversations policies
CREATE POLICY "Users can view their own WhatsApp conversations"
  ON whatsapp_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert WhatsApp conversations"
  ON whatsapp_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update WhatsApp conversations"
  ON whatsapp_conversations FOR UPDATE
  USING (true);

-- Agent execution queue policies
CREATE POLICY "Users can view their company's executions"
  ON agent_execution_queue FOR SELECT
  USING (
    agent_id IN (
      SELECT id FROM agents 
      WHERE company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "System can manage execution queue"
  ON agent_execution_queue FOR ALL
  USING (true);

-- WhatsApp templates policies
CREATE POLICY "Users can view templates"
  ON whatsapp_templates FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage templates"
  ON whatsapp_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- WhatsApp preferences policies
CREATE POLICY "Users can view own preferences"
  ON whatsapp_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own preferences"
  ON whatsapp_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own preferences"
  ON whatsapp_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Functions
CREATE OR REPLACE FUNCTION get_user_by_phone(phone_number TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  company_id UUID,
  role TEXT,
  phone TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.email, p.company_id, p.role, p.phone
  FROM profiles p
  WHERE p.phone = phone_number
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log WhatsApp activity
CREATE OR REPLACE FUNCTION log_whatsapp_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Track behavioral signal for persona detection
  IF NEW.user_id IS NOT NULL AND NEW.intent_type IS NOT NULL THEN
    INSERT INTO user_behavior_signals (
      user_id,
      company_id,
      action_type,
      action_context,
      streamliner_weight,
      navigator_weight,
      hub_weight,
      spring_weight,
      processor_weight
    )
    SELECT
      NEW.user_id,
      p.company_id,
      'whatsapp_' || NEW.intent_type,
      jsonb_build_object(
        'phone', NEW.phone_number,
        'intent', NEW.intent_type,
        'confidence', NEW.intent_confidence,
        'entities', NEW.entities
      ),
      CASE 
        WHEN NEW.intent_type IN ('check_inventory', 'view_alerts') THEN 0.8
        ELSE 0.2
      END,
      CASE 
        WHEN NEW.intent_type IN ('generate_report', 'supplier_performance') THEN 0.8
        ELSE 0.2
      END,
      CASE 
        WHEN NEW.entities->>'multi_entity' = 'true' THEN 0.8
        ELSE 0.2
      END,
      CASE 
        WHEN NEW.intent_type = 'help' THEN 0.8
        ELSE 0.2
      END,
      CASE 
        WHEN NEW.intent_type = 'agent_status' THEN 0.8
        ELSE 0.2
      END
    FROM profiles p
    WHERE p.id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for WhatsApp activity logging
CREATE TRIGGER log_whatsapp_activity_trigger
  AFTER INSERT OR UPDATE ON whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION log_whatsapp_activity();

-- Seed initial WhatsApp templates
INSERT INTO whatsapp_templates (template_name, persona, intent_type, template_body, variables) VALUES
  ('welcome_streamliner', 'streamliner', NULL, 
   '⚡ Welcome to Supply Chain Intelligence!\n\nQuick commands:\n📦 stock [SKU]\n🚨 alerts\n📊 report\n\nReply HELP anytime.', 
   '{}'),
  
  ('welcome_navigator', 'navigator', NULL,
   '🎯 Welcome to Supply Chain Intelligence\n\nYour command center is ready. Available operations:\n• Inventory Management\n• Alert Monitoring\n• Report Generation\n• Supplier Analytics\n\nReply HELP for detailed commands.',
   '{}'),
   
  ('daily_digest_streamliner', 'streamliner', 'daily_digest',
   '📊 Daily Summary {{date}}\n\nAlerts: {{alerts}}\nOrders: {{orders}}\nCash: ${{cash}}\n\nReply for details.',
   '{"date": "string", "alerts": "number", "orders": "number", "cash": "number"}'),
   
  ('alert_notification', NULL, 'alert',
   '{{emoji}} {{title}}\n\n{{message}}\n\nSeverity: {{severity}}\n\nReply ACK to acknowledge.',
   '{"emoji": "string", "title": "string", "message": "string", "severity": "string"}')
ON CONFLICT (template_name) DO NOTHING;