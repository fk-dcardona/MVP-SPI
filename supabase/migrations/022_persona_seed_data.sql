-- Seed data for testing persona-adaptive system
-- This demonstrates the Merging Philosophy with example behaviors

-- Create test users with different personas
DO $$
DECLARE
  v_streamliner_id UUID := gen_random_uuid();
  v_navigator_id UUID := gen_random_uuid();
  v_hub_id UUID := gen_random_uuid();
  v_spring_id UUID := gen_random_uuid();
  v_processor_id UUID := gen_random_uuid();
  v_company_id UUID;
BEGIN
  -- Get a company ID (assuming at least one exists)
  SELECT id INTO v_company_id FROM companies LIMIT 1;
  
  IF v_company_id IS NULL THEN
    -- Create a test company if none exists
    INSERT INTO companies (id, name, industry, size)
    VALUES (gen_random_uuid(), 'Test Company', 'Technology', 'medium')
    RETURNING id INTO v_company_id;
  END IF;
  
  -- Insert test profiles (if they don't exist)
  INSERT INTO profiles (id, email, full_name, role, company_id, detected_persona, persona_confidence)
  VALUES 
    (v_streamliner_id, 'streamliner@test.com', 'Speed Runner', 'analyst', v_company_id, 'streamliner', 0.85),
    (v_navigator_id, 'navigator@test.com', 'Control Master', 'manager', v_company_id, 'navigator', 0.90),
    (v_hub_id, 'hub@test.com', 'Network Manager', 'admin', v_company_id, 'hub', 0.88),
    (v_spring_id, 'spring@test.com', 'New Learner', 'analyst', v_company_id, 'spring', 0.75),
    (v_processor_id, 'processor@test.com', 'System Admin', 'admin', v_company_id, 'processor', 0.92)
  ON CONFLICT (email) DO NOTHING;
  
  -- Generate behavior signals for Streamliner
  INSERT INTO user_behavior_signals (user_id, company_id, action_type, completion_time_ms, 
    streamliner_weight, navigator_weight, hub_weight, spring_weight, processor_weight, action_context)
  SELECT 
    v_streamliner_id, v_company_id, action_type, completion_time,
    0.8, 0.1, 0.05, 0.05, 0.0, jsonb_build_object('test', true)
  FROM (VALUES 
    ('quick_upload', 1200),
    ('keyboard_shortcut', 50),
    ('bulk_action', 3000),
    ('quick_upload', 980),
    ('keyboard_shortcut', 45)
  ) AS t(action_type, completion_time);
  
  -- Generate behavior signals for Navigator
  INSERT INTO user_behavior_signals (user_id, company_id, action_type, completion_time_ms,
    streamliner_weight, navigator_weight, hub_weight, spring_weight, processor_weight, action_context)
  SELECT 
    v_navigator_id, v_company_id, action_type, completion_time,
    0.1, 0.8, 0.05, 0.05, 0.0, jsonb_build_object('test', true)
  FROM (VALUES 
    ('custom_dashboard', 15000),
    ('save_view', 2000),
    ('set_threshold', 3000),
    ('predictive_analytics_view', 5000)
  ) AS t(action_type, completion_time);
  
  -- Generate behavior signals for Hub
  INSERT INTO user_behavior_signals (user_id, company_id, action_type, completion_time_ms,
    streamliner_weight, navigator_weight, hub_weight, spring_weight, processor_weight, action_context)
  SELECT 
    v_hub_id, v_company_id, action_type, completion_time,
    0.05, 0.1, 0.8, 0.05, 0.0, jsonb_build_object('test', true)
  FROM (VALUES 
    ('switch_entity', 500),
    ('consolidated_report', 8000),
    ('multi_entity_action', 4000),
    ('network_visualization_view', 6000)
  ) AS t(action_type, completion_time);
  
  -- Generate behavior signals for Spring
  INSERT INTO user_behavior_signals (user_id, company_id, action_type, completion_time_ms,
    streamliner_weight, navigator_weight, hub_weight, spring_weight, processor_weight, action_context)
  SELECT 
    v_spring_id, v_company_id, action_type, completion_time,
    0.0, 0.0, 0.0, 0.9, 0.1, jsonb_build_object('test', true)
  FROM (VALUES 
    ('tutorial_start', 30000),
    ('help_accessed', 5000),
    ('practice_mode', 20000),
    ('onboarding_step', 10000)
  ) AS t(action_type, completion_time);
  
  -- Generate behavior signals for Processor
  INSERT INTO user_behavior_signals (user_id, company_id, action_type, completion_time_ms,
    streamliner_weight, navigator_weight, hub_weight, spring_weight, processor_weight, action_context)
  SELECT 
    v_processor_id, v_company_id, action_type, completion_time,
    0.0, 0.1, 0.0, 0.0, 0.9, jsonb_build_object('test', true)
  FROM (VALUES 
    ('view_logs', 4000),
    ('system_config', 8000),
    ('health_check', 2000),
    ('audit_trail_view', 6000)
  ) AS t(action_type, completion_time);
  
  -- Calculate persona scores for all test users
  PERFORM calculate_user_persona(v_streamliner_id);
  PERFORM calculate_user_persona(v_navigator_id);
  PERFORM calculate_user_persona(v_hub_id);
  PERFORM calculate_user_persona(v_spring_id);
  PERFORM calculate_user_persona(v_processor_id);
  
  -- Set up preferences for each persona
  INSERT INTO user_preferences (user_id, quick_actions, keyboard_shortcuts_enabled, onboarding_completed)
  VALUES 
    (v_streamliner_id, ARRAY['upload', 'bulk_edit', 'export'], true, true),
    (v_navigator_id, ARRAY['dashboard', 'analytics'], true, true),
    (v_hub_id, ARRAY['switch_entity', 'reports'], true, true),
    (v_spring_id, ARRAY['help', 'tutorial'], true, false),
    (v_processor_id, ARRAY['logs', 'config'], true, true)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Set up system health preferences
  INSERT INTO system_health_preferences (user_id, priority_metrics, refresh_interval_seconds)
  VALUES 
    (v_streamliner_id, ARRAY['response_time', 'api_latency', 'data_processing'], 5),
    (v_navigator_id, ARRAY['error_rate', 'system_uptime', 'prediction_accuracy'], 30),
    (v_hub_id, ARRAY['data_processing', 'system_uptime', 'network_latency'], 30),
    (v_spring_id, ARRAY['system_uptime', 'error_rate', 'help_availability'], 60),
    (v_processor_id, ARRAY['memory_usage', 'cpu_usage', 'error_rate', 'system_uptime'], 10)
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Test persona data created successfully';
END;
$$;