-- WhatsApp adaptive response patterns
CREATE TABLE IF NOT EXISTS whatsapp_response_patterns (
  pattern_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona TEXT CHECK (persona IN ('streamliner', 'navigator', 'hub', 'spring', 'processor')),
  intent_type TEXT NOT NULL,
  context_type TEXT NOT NULL,
  response_template TEXT NOT NULL,
  success_rate NUMERIC DEFAULT 1.0 CHECK (success_rate >= 0 AND success_rate <= 1),
  usage_count INTEGER DEFAULT 0,
  variables JSONB DEFAULT '[]',
  
  -- Learning metadata
  learned_from_conversation UUID REFERENCES whatsapp_conversation_state(thread_id),
  original_response TEXT,
  user_feedback TEXT CHECK (user_feedback IN ('positive', 'negative', 'neutral')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Response effectiveness tracking
CREATE TABLE IF NOT EXISTS whatsapp_response_effectiveness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern_id UUID REFERENCES whatsapp_response_patterns(pattern_id),
  conversation_id UUID REFERENCES whatsapp_conversation_state(thread_id),
  response_text TEXT NOT NULL,
  user_reaction TEXT,
  effectiveness_score NUMERIC CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),
  response_time_seconds INTEGER,
  follow_up_needed BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Natural language feedback storage
CREATE TABLE IF NOT EXISTS whatsapp_user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  conversation_id UUID REFERENCES whatsapp_conversation_state(thread_id),
  feedback_type TEXT CHECK (feedback_type IN ('correction', 'preference', 'satisfaction', 'suggestion')),
  original_message TEXT,
  user_correction TEXT,
  feedback_text TEXT NOT NULL,
  
  -- Processed feedback
  processed BOOLEAN DEFAULT false,
  learned_pattern TEXT,
  applied_to_patterns UUID[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_response_patterns_persona_intent ON whatsapp_response_patterns(persona, intent_type);
CREATE INDEX IF NOT EXISTS idx_response_patterns_success ON whatsapp_response_patterns(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_response_effectiveness_pattern ON whatsapp_response_effectiveness(pattern_id);
CREATE INDEX IF NOT EXISTS idx_response_effectiveness_score ON whatsapp_response_effectiveness(effectiveness_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_processed ON whatsapp_user_feedback(processed, created_at);

-- RLS policies
ALTER TABLE whatsapp_response_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_response_effectiveness ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_user_feedback ENABLE ROW LEVEL SECURITY;

-- Response patterns policies
CREATE POLICY "System can manage response patterns"
  ON whatsapp_response_patterns FOR ALL
  USING (true);

-- Effectiveness tracking policies
CREATE POLICY "System can track effectiveness"
  ON whatsapp_response_effectiveness FOR ALL
  USING (true);

-- Feedback policies
CREATE POLICY "Users can view their own feedback"
  ON whatsapp_user_feedback FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage all feedback"
  ON whatsapp_user_feedback FOR ALL
  USING (true);

-- Function to update pattern effectiveness
CREATE OR REPLACE FUNCTION update_pattern_effectiveness()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the pattern's success rate based on effectiveness scores
  UPDATE whatsapp_response_patterns
  SET 
    success_rate = (
      SELECT AVG(effectiveness_score)
      FROM whatsapp_response_effectiveness
      WHERE pattern_id = NEW.pattern_id
      AND created_at > NOW() - INTERVAL '30 days'
    ),
    usage_count = usage_count + 1,
    updated_at = NOW()
  WHERE pattern_id = NEW.pattern_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for pattern effectiveness updates
CREATE TRIGGER update_pattern_effectiveness_trigger
  AFTER INSERT ON whatsapp_response_effectiveness
  FOR EACH ROW
  EXECUTE FUNCTION update_pattern_effectiveness();

-- Function to process user feedback and learn patterns
CREATE OR REPLACE FUNCTION process_user_feedback(p_feedback_id UUID)
RETURNS VOID AS $$
DECLARE
  v_feedback RECORD;
  v_new_pattern_id UUID;
BEGIN
  -- Get feedback details
  SELECT * INTO v_feedback
  FROM whatsapp_user_feedback
  WHERE id = p_feedback_id;
  
  -- Process correction feedback
  IF v_feedback.feedback_type = 'correction' THEN
    -- Create new pattern based on user correction
    INSERT INTO whatsapp_response_patterns (
      persona,
      intent_type,
      context_type,
      response_template,
      success_rate,
      original_response,
      user_feedback
    )
    SELECT 
      cs.persona,
      'learned_from_correction',
      'user_corrected',
      v_feedback.user_correction,
      0.9, -- Start with high confidence for user corrections
      v_feedback.original_message,
      'correction'
    FROM whatsapp_conversation_state cs
    WHERE cs.thread_id = v_feedback.conversation_id
    RETURNING pattern_id INTO v_new_pattern_id;
    
    -- Mark feedback as processed
    UPDATE whatsapp_user_feedback
    SET 
      processed = true,
      learned_pattern = v_new_pattern_id::text,
      applied_to_patterns = ARRAY[v_new_pattern_id]
    WHERE id = p_feedback_id;
  END IF;
  
  -- Process preference feedback
  IF v_feedback.feedback_type = 'preference' THEN
    -- Update existing patterns for this user's persona
    UPDATE whatsapp_response_patterns
    SET 
      success_rate = success_rate * 0.9, -- Reduce effectiveness
      updated_at = NOW()
    WHERE persona = (
      SELECT persona 
      FROM whatsapp_conversation_state cs
      WHERE cs.thread_id = v_feedback.conversation_id
    )
    AND response_template ILIKE '%' || v_feedback.feedback_text || '%';
    
    -- Mark as processed
    UPDATE whatsapp_user_feedback
    SET processed = true
    WHERE id = p_feedback_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get best response pattern for context
CREATE OR REPLACE FUNCTION get_best_response_pattern(
  p_persona TEXT,
  p_intent_type TEXT,
  p_context_type TEXT DEFAULT 'standard'
)
RETURNS TABLE (
  pattern_id UUID,
  response_template TEXT,
  success_rate NUMERIC,
  variables JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rp.pattern_id,
    rp.response_template,
    rp.success_rate,
    rp.variables
  FROM whatsapp_response_patterns rp
  WHERE rp.persona = p_persona
    AND rp.intent_type = p_intent_type
    AND (rp.context_type = p_context_type OR p_context_type = 'standard')
    AND rp.success_rate > 0.5
  ORDER BY rp.success_rate DESC, rp.usage_count DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to analyze response effectiveness trends
CREATE OR REPLACE FUNCTION analyze_response_effectiveness(
  p_persona TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  intent_type TEXT,
  avg_effectiveness NUMERIC,
  response_count INTEGER,
  improvement_trend TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH effectiveness_data AS (
    SELECT 
      rp.intent_type,
      re.effectiveness_score,
      re.created_at,
      ROW_NUMBER() OVER (PARTITION BY rp.intent_type ORDER BY re.created_at) as seq_num,
      COUNT(*) OVER (PARTITION BY rp.intent_type) as total_count
    FROM whatsapp_response_effectiveness re
    JOIN whatsapp_response_patterns rp ON re.pattern_id = rp.pattern_id
    WHERE (p_persona IS NULL OR rp.persona = p_persona)
      AND re.created_at > NOW() - INTERVAL '1 day' * p_days
  ),
  trend_analysis AS (
    SELECT 
      intent_type,
      AVG(effectiveness_score) as avg_effectiveness,
      COUNT(*) as response_count,
      CASE 
        WHEN COUNT(*) < 5 THEN 'insufficient_data'
        WHEN AVG(CASE WHEN seq_num > total_count/2 THEN effectiveness_score END) > 
             AVG(CASE WHEN seq_num <= total_count/2 THEN effectiveness_score END) THEN 'improving'
        ELSE 'declining'
      END as improvement_trend
    FROM effectiveness_data
    GROUP BY intent_type
  )
  SELECT 
    ta.intent_type,
    ta.avg_effectiveness,
    ta.response_count,
    ta.improvement_trend
  FROM trend_analysis ta
  ORDER BY ta.avg_effectiveness DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed some initial response patterns
INSERT INTO whatsapp_response_patterns (persona, intent_type, context_type, response_template, variables) VALUES
  -- Streamliner patterns
  ('streamliner', 'check_inventory', 'standard', '📦 {{product}}: {{quantity}} units\n{{status_emoji}} {{status}}', '["product", "quantity", "status_emoji", "status"]'),
  ('streamliner', 'view_alerts', 'standard', '🚨 {{total}} alerts\nCritical: {{critical}}', '["total", "critical"]'),
  ('streamliner', 'daily_digest', 'standard', '📊 Today:\nAlerts: {{alerts}}\nCash: ${{cash}}', '["alerts", "cash"]'),
  
  -- Navigator patterns
  ('navigator', 'check_inventory', 'standard', '📊 **Inventory Analysis**\n\nProduct: {{product}}\nCurrent: {{quantity}} units\nStatus: {{status}}\n\nRecommendation: {{recommendation}}', '["product", "quantity", "status", "recommendation"]'),
  ('navigator', 'generate_report', 'standard', '📋 **{{report_type}} Report**\n\nPeriod: {{period}}\nKey Insights:\n{{insights}}\n\nAccess: {{link}}', '["report_type", "period", "insights", "link"]'),
  
  -- Spring patterns
  ('spring', 'check_inventory', 'standard', '📚 Let me explain what I found!\n\nProduct: {{product}}\nYou have: {{quantity}} units\n\n💡 {{helpful_tip}}', '["product", "quantity", "helpful_tip"]'),
  ('spring', 'help', 'standard', '🌟 I''m here to help you learn!\n\nHere are some things you can try:\n{{command_list}}\n\nReply with any questions!', '["command_list"]'),
  
  -- Hub patterns
  ('hub', 'check_inventory', 'standard', '🏢 **Network Inventory**\n\nProduct: {{product}}\nTotal: {{total_quantity}} units\nEntities: {{entity_count}}\n\n{{entity_breakdown}}', '["product", "total_quantity", "entity_count", "entity_breakdown"]'),
  
  -- Processor patterns
  ('processor', 'check_inventory', 'standard', '[INVENTORY_QUERY]\nSKU: {{sku}}\nQTY: {{quantity}}\nSTATUS: {{status}}\nTIMESTAMP: {{timestamp}}', '["sku", "quantity", "status", "timestamp"]')
ON CONFLICT (pattern_id) DO NOTHING;