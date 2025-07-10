-- Migration: Persona-Adaptive System Support
-- Following the Merging Philosophy: One system that adapts to user behavior

-- 1. Add persona detection fields to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS detected_persona VARCHAR(20) CHECK (detected_persona IN ('streamliner', 'navigator', 'hub', 'spring', 'processor')),
ADD COLUMN IF NOT EXISTS persona_confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (persona_confidence >= 0 AND persona_confidence <= 1),
ADD COLUMN IF NOT EXISTS persona_updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW());

-- 2. Create user_behavior_signals table for tracking actions
CREATE TABLE IF NOT EXISTS user_behavior_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Behavior tracking
  action_type VARCHAR(50) NOT NULL,
  action_context JSONB DEFAULT '{}',
  completion_time_ms INTEGER,
  
  -- Persona weights (how this action affects persona scores)
  streamliner_weight DECIMAL(3,2) DEFAULT 0,
  navigator_weight DECIMAL(3,2) DEFAULT 0,
  hub_weight DECIMAL(3,2) DEFAULT 0,
  spring_weight DECIMAL(3,2) DEFAULT 0,
  processor_weight DECIMAL(3,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Create persona_scores table for aggregated scores
CREATE TABLE IF NOT EXISTS persona_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  -- Cumulative scores
  streamliner_score DECIMAL(10,2) DEFAULT 0,
  navigator_score DECIMAL(10,2) DEFAULT 0,
  hub_score DECIMAL(10,2) DEFAULT 0,
  spring_score DECIMAL(10,2) DEFAULT 0,
  processor_score DECIMAL(10,2) DEFAULT 0,
  
  -- Tracking
  signals_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  CONSTRAINT unique_user_persona_scores UNIQUE (user_id)
);

-- 4. Create user_preferences table for storing persona-specific settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dashboard preferences
  dashboard_layout JSONB DEFAULT '{}',
  widget_preferences JSONB DEFAULT '{}',
  
  -- Speed preferences (Streamliners)
  quick_actions JSONB DEFAULT '[]',
  keyboard_shortcuts_enabled BOOLEAN DEFAULT true,
  
  -- Control preferences (Navigators)
  saved_views JSONB DEFAULT '[]',
  alert_thresholds JSONB DEFAULT '{}',
  
  -- Network preferences (Hubs)
  default_entity_view VARCHAR(50),
  consolidated_report_settings JSONB DEFAULT '{}',
  
  -- Learning preferences (Springs)
  onboarding_completed BOOLEAN DEFAULT false,
  tutorial_progress JSONB DEFAULT '{}',
  
  -- System preferences (Processors)
  monitoring_dashboard_config JSONB DEFAULT '{}',
  audit_retention_days INTEGER DEFAULT 90,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  CONSTRAINT unique_user_preferences UNIQUE (user_id)
);

-- 5. Create feature_usage_metrics table
CREATE TABLE IF NOT EXISTS feature_usage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  
  feature_name VARCHAR(100) NOT NULL,
  usage_count INTEGER DEFAULT 0,
  total_time_ms BIGINT DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  -- Performance metrics
  avg_completion_time_ms INTEGER GENERATED ALWAYS AS (
    CASE WHEN usage_count > 0 THEN total_time_ms / usage_count ELSE 0 END
  ) STORED,
  
  CONSTRAINT unique_user_feature_usage UNIQUE (user_id, feature_name)
);

-- 6. Create system_health_preferences table for adaptive monitoring
CREATE TABLE IF NOT EXISTS system_health_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Which metrics to prioritize based on persona
  priority_metrics JSONB DEFAULT '[]',
  alert_preferences JSONB DEFAULT '{}',
  refresh_interval_seconds INTEGER DEFAULT 30,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  
  CONSTRAINT unique_user_health_prefs UNIQUE (user_id)
);

-- 7. Create indexes for performance
CREATE INDEX idx_behavior_signals_user_id ON user_behavior_signals(user_id);
CREATE INDEX idx_behavior_signals_created_at ON user_behavior_signals(created_at DESC);
CREATE INDEX idx_behavior_signals_action_type ON user_behavior_signals(action_type);

CREATE INDEX idx_persona_scores_user_id ON persona_scores(user_id);
CREATE INDEX idx_feature_usage_user_id ON feature_usage_metrics(user_id);
CREATE INDEX idx_feature_usage_feature_name ON feature_usage_metrics(feature_name);

-- 8. Enable RLS on new tables
ALTER TABLE user_behavior_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE persona_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_preferences ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own behavior signals" ON user_behavior_signals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own behavior signals" ON user_behavior_signals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own persona scores" ON persona_scores
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view own feature usage" ON feature_usage_metrics
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own health preferences" ON system_health_preferences
  FOR ALL USING (user_id = auth.uid());

-- 10. Create function to calculate persona from signals
CREATE OR REPLACE FUNCTION calculate_user_persona(p_user_id UUID)
RETURNS TABLE (
  detected_persona VARCHAR(20),
  confidence DECIMAL(3,2),
  scores JSONB
) AS $$
DECLARE
  v_scores RECORD;
  v_max_score DECIMAL;
  v_total_score DECIMAL;
  v_persona VARCHAR(20);
  v_confidence DECIMAL(3,2);
BEGIN
  -- Get or create persona scores
  INSERT INTO persona_scores (user_id, company_id)
  SELECT p_user_id, company_id FROM profiles WHERE id = p_user_id
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Update scores from recent signals
  UPDATE persona_scores ps
  SET 
    streamliner_score = COALESCE((
      SELECT SUM(streamliner_weight) 
      FROM user_behavior_signals 
      WHERE user_id = p_user_id 
      AND created_at > NOW() - INTERVAL '30 days'
    ), 0),
    navigator_score = COALESCE((
      SELECT SUM(navigator_weight) 
      FROM user_behavior_signals 
      WHERE user_id = p_user_id 
      AND created_at > NOW() - INTERVAL '30 days'
    ), 0),
    hub_score = COALESCE((
      SELECT SUM(hub_weight) 
      FROM user_behavior_signals 
      WHERE user_id = p_user_id 
      AND created_at > NOW() - INTERVAL '30 days'
    ), 0),
    spring_score = COALESCE((
      SELECT SUM(spring_weight) 
      FROM user_behavior_signals 
      WHERE user_id = p_user_id 
      AND created_at > NOW() - INTERVAL '30 days'
    ), 0),
    processor_score = COALESCE((
      SELECT SUM(processor_weight) 
      FROM user_behavior_signals 
      WHERE user_id = p_user_id 
      AND created_at > NOW() - INTERVAL '30 days'
    ), 0),
    signals_count = (
      SELECT COUNT(*) 
      FROM user_behavior_signals 
      WHERE user_id = p_user_id
    ),
    last_calculated_at = NOW()
  WHERE user_id = p_user_id;
  
  -- Get current scores
  SELECT * INTO v_scores
  FROM persona_scores
  WHERE user_id = p_user_id;
  
  -- Calculate total score
  v_total_score := v_scores.streamliner_score + v_scores.navigator_score + 
                   v_scores.hub_score + v_scores.spring_score + v_scores.processor_score;
  
  -- Determine dominant persona
  v_max_score := GREATEST(
    v_scores.streamliner_score,
    v_scores.navigator_score,
    v_scores.hub_score,
    v_scores.spring_score,
    v_scores.processor_score
  );
  
  -- Set persona based on highest score
  v_persona := CASE v_max_score
    WHEN v_scores.streamliner_score THEN 'streamliner'
    WHEN v_scores.navigator_score THEN 'navigator'
    WHEN v_scores.hub_score THEN 'hub'
    WHEN v_scores.spring_score THEN 'spring'
    WHEN v_scores.processor_score THEN 'processor'
    ELSE 'streamliner' -- Default
  END;
  
  -- Calculate confidence (0-1 scale)
  IF v_total_score > 0 THEN
    v_confidence := LEAST(1.0, v_max_score / GREATEST(v_total_score * 0.4, 1));
  ELSE
    v_confidence := 0.0;
  END IF;
  
  -- Update profile with detected persona
  UPDATE profiles
  SET 
    detected_persona = v_persona,
    persona_confidence = v_confidence,
    persona_updated_at = NOW()
  WHERE id = p_user_id;
  
  RETURN QUERY
  SELECT 
    v_persona,
    v_confidence,
    jsonb_build_object(
      'streamliner', v_scores.streamliner_score,
      'navigator', v_scores.navigator_score,
      'hub', v_scores.hub_score,
      'spring', v_scores.spring_score,
      'processor', v_scores.processor_score,
      'total_signals', v_scores.signals_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Create function to track user behavior
CREATE OR REPLACE FUNCTION track_user_behavior(
  p_user_id UUID,
  p_action_type VARCHAR(50),
  p_context JSONB DEFAULT '{}',
  p_completion_time_ms INTEGER DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_signal_id UUID;
  v_company_id UUID;
  v_weights RECORD;
BEGIN
  -- Get user's company
  SELECT company_id INTO v_company_id
  FROM profiles
  WHERE id = p_user_id;
  
  -- Calculate weights based on action type
  -- This is where the Merging Philosophy happens - one action, multiple interpretations
  v_weights := CASE p_action_type
    -- Speed-focused actions
    WHEN 'quick_upload' THEN ROW(0.8, 0.1, 0.1, 0.0, 0.0)::RECORD
    WHEN 'keyboard_shortcut' THEN ROW(0.9, 0.1, 0.0, 0.0, 0.0)::RECORD
    WHEN 'bulk_action' THEN ROW(0.7, 0.2, 0.1, 0.0, 0.0)::RECORD
    
    -- Control-focused actions
    WHEN 'custom_dashboard' THEN ROW(0.1, 0.8, 0.1, 0.0, 0.0)::RECORD
    WHEN 'save_view' THEN ROW(0.0, 0.9, 0.1, 0.0, 0.0)::RECORD
    WHEN 'set_threshold' THEN ROW(0.0, 0.8, 0.0, 0.0, 0.2)::RECORD
    
    -- Network-focused actions
    WHEN 'switch_entity' THEN ROW(0.0, 0.1, 0.8, 0.0, 0.1)::RECORD
    WHEN 'consolidated_report' THEN ROW(0.0, 0.2, 0.8, 0.0, 0.0)::RECORD
    WHEN 'multi_entity_action' THEN ROW(0.1, 0.1, 0.8, 0.0, 0.0)::RECORD
    
    -- Learning-focused actions
    WHEN 'tutorial_start' THEN ROW(0.0, 0.0, 0.0, 0.9, 0.1)::RECORD
    WHEN 'help_accessed' THEN ROW(0.0, 0.0, 0.0, 0.8, 0.2)::RECORD
    WHEN 'practice_mode' THEN ROW(0.0, 0.0, 0.0, 0.9, 0.1)::RECORD
    
    -- System-focused actions
    WHEN 'view_logs' THEN ROW(0.0, 0.1, 0.0, 0.0, 0.9)::RECORD
    WHEN 'system_config' THEN ROW(0.0, 0.2, 0.0, 0.0, 0.8)::RECORD
    WHEN 'health_check' THEN ROW(0.0, 0.1, 0.1, 0.0, 0.8)::RECORD
    
    -- Default balanced weights
    ELSE ROW(0.2, 0.2, 0.2, 0.2, 0.2)::RECORD
  END;
  
  -- Insert behavior signal
  INSERT INTO user_behavior_signals (
    user_id,
    company_id,
    action_type,
    action_context,
    completion_time_ms,
    streamliner_weight,
    navigator_weight,
    hub_weight,
    spring_weight,
    processor_weight
  ) VALUES (
    p_user_id,
    v_company_id,
    p_action_type,
    p_context,
    p_completion_time_ms,
    (v_weights).f1,
    (v_weights).f2,
    (v_weights).f3,
    (v_weights).f4,
    (v_weights).f5
  ) RETURNING id INTO v_signal_id;
  
  -- Update feature usage metrics
  INSERT INTO feature_usage_metrics (user_id, company_id, feature_name, usage_count, total_time_ms)
  VALUES (p_user_id, v_company_id, p_action_type, 1, COALESCE(p_completion_time_ms, 0))
  ON CONFLICT (user_id, feature_name) 
  DO UPDATE SET 
    usage_count = feature_usage_metrics.usage_count + 1,
    total_time_ms = feature_usage_metrics.total_time_ms + COALESCE(EXCLUDED.total_time_ms, 0),
    last_used_at = NOW();
  
  RETURN v_signal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create view for user insights
CREATE OR REPLACE VIEW user_persona_insights AS
SELECT 
  p.id as user_id,
  p.email,
  p.detected_persona,
  p.persona_confidence,
  ps.streamliner_score,
  ps.navigator_score,
  ps.hub_score,
  ps.spring_score,
  ps.processor_score,
  ps.signals_count,
  ps.last_calculated_at,
  COUNT(DISTINCT bs.action_type) as unique_actions,
  AVG(bs.completion_time_ms) as avg_completion_time
FROM profiles p
LEFT JOIN persona_scores ps ON p.id = ps.user_id
LEFT JOIN user_behavior_signals bs ON p.id = bs.user_id
GROUP BY p.id, p.email, p.detected_persona, p.persona_confidence,
         ps.streamliner_score, ps.navigator_score, ps.hub_score, 
         ps.spring_score, ps.processor_score, ps.signals_count, ps.last_calculated_at;

-- Grant permissions
GRANT SELECT ON user_persona_insights TO authenticated;

-- 13. Trigger to auto-update updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_health_preferences_updated_at
  BEFORE UPDATE ON system_health_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 14. Initialize preferences for existing users
INSERT INTO user_preferences (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO system_health_preferences (user_id)
SELECT id FROM profiles
ON CONFLICT (user_id) DO NOTHING;