-- WhatsApp conversation state management
CREATE TABLE IF NOT EXISTS whatsapp_conversation_state (
  thread_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES profiles(id),
  persona TEXT CHECK (persona IN ('streamliner', 'navigator', 'hub', 'spring', 'processor')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Conversation memory
  context_window JSONB DEFAULT '[]',
  working_memory JSONB DEFAULT '{
    "current_task": null,
    "entities_mentioned": {},
    "pending_clarifications": [],
    "user_preferences_learned": {},
    "last_referenced_items": []
  }',
  long_term_memory JSONB DEFAULT '{
    "common_queries": [],
    "preferred_suppliers": [],
    "typical_order_patterns": [],
    "communication_preferences": {
      "response_style": "detailed",
      "preferred_times": [],
      "language_patterns": []
    }
  }',
  
  -- Learning data
  successful_interactions JSONB DEFAULT '[]',
  conversation_metrics JSONB DEFAULT '{
    "total_messages": 0,
    "successful_resolutions": 0,
    "clarifications_needed": 0,
    "average_response_time": null
  }',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learned intents table for dynamic pattern recognition
CREATE TABLE IF NOT EXISTS whatsapp_learned_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern TEXT NOT NULL,
  intent_type TEXT NOT NULL,
  learned_from_conversation UUID REFERENCES whatsapp_conversation_state(thread_id),
  success_rate NUMERIC DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  user_corrections JSONB DEFAULT '[]',
  contextual_variants JSONB DEFAULT '[]',
  entity_patterns JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation insights for proactive messaging
CREATE TABLE IF NOT EXISTS whatsapp_conversation_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  insight_type TEXT CHECK (insight_type IN ('pattern', 'opportunity', 'risk', 'preference')),
  confidence NUMERIC CHECK (confidence >= 0 AND confidence <= 1),
  data JSONB NOT NULL,
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_state_phone ON whatsapp_conversation_state(phone_number);
CREATE INDEX IF NOT EXISTS idx_conversation_state_user ON whatsapp_conversation_state(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_state_activity ON whatsapp_conversation_state(last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_learned_intents_pattern ON whatsapp_learned_intents(pattern);
CREATE INDEX IF NOT EXISTS idx_learned_intents_success ON whatsapp_learned_intents(success_rate DESC);
CREATE INDEX IF NOT EXISTS idx_insights_user_type ON whatsapp_conversation_insights(user_id, insight_type);
CREATE INDEX IF NOT EXISTS idx_insights_triggered ON whatsapp_conversation_insights(triggered_at DESC);

-- RLS policies
ALTER TABLE whatsapp_conversation_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_learned_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversation_insights ENABLE ROW LEVEL SECURITY;

-- Conversation state policies
CREATE POLICY "System can manage conversation state"
  ON whatsapp_conversation_state FOR ALL
  USING (true);

-- Learned intents policies
CREATE POLICY "System can manage learned intents"
  ON whatsapp_learned_intents FOR ALL
  USING (true);

-- Insights policies
CREATE POLICY "Users can view their own insights"
  ON whatsapp_conversation_insights FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage insights"
  ON whatsapp_conversation_insights FOR ALL
  USING (true);

-- Function to update conversation metrics
CREATE OR REPLACE FUNCTION update_conversation_metrics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update last activity
  NEW.last_activity = NOW();
  NEW.updated_at = NOW();
  
  -- Update metrics based on context window
  NEW.conversation_metrics = jsonb_set(
    NEW.conversation_metrics,
    '{total_messages}',
    to_jsonb(jsonb_array_length(NEW.context_window))
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for metrics update
CREATE TRIGGER update_conversation_metrics_trigger
  BEFORE UPDATE ON whatsapp_conversation_state
  FOR EACH ROW
  WHEN (OLD.context_window IS DISTINCT FROM NEW.context_window)
  EXECUTE FUNCTION update_conversation_metrics();

-- Function to analyze conversation patterns
CREATE OR REPLACE FUNCTION analyze_conversation_patterns(p_user_id UUID)
RETURNS TABLE (
  pattern_type TEXT,
  pattern_value TEXT,
  frequency INTEGER,
  confidence NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH user_conversations AS (
    SELECT 
      long_term_memory,
      context_window
    FROM whatsapp_conversation_state
    WHERE user_id = p_user_id
  ),
  common_patterns AS (
    SELECT 
      'common_query' as pattern_type,
      elem->>'query' as pattern_value,
      (elem->>'frequency')::INTEGER as frequency,
      CASE 
        WHEN (elem->>'frequency')::INTEGER > 5 THEN 0.9
        WHEN (elem->>'frequency')::INTEGER > 2 THEN 0.7
        ELSE 0.5
      END as confidence
    FROM user_conversations,
    jsonb_array_elements(long_term_memory->'common_queries') elem
  ),
  order_patterns AS (
    SELECT 
      'order_pattern' as pattern_type,
      elem->>'product' as pattern_value,
      (elem->>'frequency_days')::INTEGER as frequency,
      0.8 as confidence
    FROM user_conversations,
    jsonb_array_elements(long_term_memory->'typical_order_patterns') elem
  )
  SELECT * FROM common_patterns
  UNION ALL
  SELECT * FROM order_patterns
  ORDER BY confidence DESC, frequency DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate proactive insights
CREATE OR REPLACE FUNCTION generate_proactive_insights(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_patterns RECORD;
  v_existing_insight UUID;
BEGIN
  -- Analyze patterns
  FOR v_patterns IN 
    SELECT * FROM analyze_conversation_patterns(p_user_id)
    WHERE confidence > 0.7
  LOOP
    -- Check if insight already exists
    SELECT id INTO v_existing_insight
    FROM whatsapp_conversation_insights
    WHERE user_id = p_user_id
      AND insight_type = 'pattern'
      AND data->>'pattern_value' = v_patterns.pattern_value
      AND triggered_at > NOW() - INTERVAL '7 days';
    
    -- Create new insight if doesn't exist
    IF v_existing_insight IS NULL THEN
      INSERT INTO whatsapp_conversation_insights (
        user_id,
        insight_type,
        confidence,
        data
      ) VALUES (
        p_user_id,
        'pattern',
        v_patterns.confidence,
        jsonb_build_object(
          'pattern_type', v_patterns.pattern_type,
          'pattern_value', v_patterns.pattern_value,
          'frequency', v_patterns.frequency,
          'suggested_action', 
          CASE 
            WHEN v_patterns.pattern_type = 'order_pattern' THEN 'Set up automatic reorder reminder'
            WHEN v_patterns.pattern_type = 'common_query' THEN 'Create quick access command'
            ELSE 'Review pattern for optimization'
          END
        )
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;