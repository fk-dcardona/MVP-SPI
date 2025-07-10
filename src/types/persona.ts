// Persona-related types following the Merging Philosophy

export type UserPersona = 'streamliner' | 'navigator' | 'hub' | 'spring' | 'processor';

export interface PersonaScores {
  streamliner_score: number;
  navigator_score: number;
  hub_score: number;
  spring_score: number;
  processor_score: number;
  signals_count: number;
  last_calculated_at: string;
}

export interface UserBehaviorSignal {
  id: string;
  user_id: string;
  company_id: string;
  action_type: string;
  action_context: Record<string, any>;
  completion_time_ms?: number;
  streamliner_weight: number;
  navigator_weight: number;
  hub_weight: number;
  spring_weight: number;
  processor_weight: number;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  
  // Dashboard preferences
  dashboard_layout: Record<string, any>;
  widget_preferences: Record<string, any>;
  
  // Speed preferences (Streamliners)
  quick_actions: string[];
  keyboard_shortcuts_enabled: boolean;
  
  // Control preferences (Navigators)
  saved_views: Array<{
    id: string;
    name: string;
    config: Record<string, any>;
  }>;
  alert_thresholds: Record<string, number>;
  
  // Network preferences (Hubs)
  default_entity_view?: string;
  consolidated_report_settings: Record<string, any>;
  
  // Learning preferences (Springs)
  onboarding_completed: boolean;
  tutorial_progress: Record<string, boolean>;
  
  // System preferences (Processors)
  monitoring_dashboard_config: Record<string, any>;
  audit_retention_days: number;
  
  created_at: string;
  updated_at: string;
}

export interface SystemHealthPreferences {
  id: string;
  user_id: string;
  priority_metrics: string[];
  alert_preferences: Record<string, any>;
  refresh_interval_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface FeatureUsageMetric {
  id: string;
  user_id: string;
  company_id: string;
  feature_name: string;
  usage_count: number;
  total_time_ms: number;
  last_used_at: string;
  avg_completion_time_ms: number;
}

export interface PersonaInsight {
  user_id: string;
  email: string;
  detected_persona: UserPersona | null;
  persona_confidence: number;
  streamliner_score: number;
  navigator_score: number;
  hub_score: number;
  spring_score: number;
  processor_score: number;
  signals_count: number;
  last_calculated_at: string;
  unique_actions: number;
  avg_completion_time: number;
}

// Action types for behavior tracking
export const BEHAVIOR_ACTIONS = {
  // Speed-focused actions
  QUICK_UPLOAD: 'quick_upload',
  KEYBOARD_SHORTCUT: 'keyboard_shortcut',
  BULK_ACTION: 'bulk_action',
  SPEED_DASHBOARD_VIEW: 'speed_dashboard_view',
  
  // Control-focused actions
  CUSTOM_DASHBOARD: 'custom_dashboard',
  SAVE_VIEW: 'save_view',
  SET_THRESHOLD: 'set_threshold',
  PREDICTIVE_ANALYTICS_VIEW: 'predictive_analytics_view',
  
  // Network-focused actions
  SWITCH_ENTITY: 'switch_entity',
  CONSOLIDATED_REPORT: 'consolidated_report',
  MULTI_ENTITY_ACTION: 'multi_entity_action',
  NETWORK_VISUALIZATION_VIEW: 'network_visualization_view',
  
  // Learning-focused actions
  TUTORIAL_START: 'tutorial_start',
  HELP_ACCESSED: 'help_accessed',
  PRACTICE_MODE: 'practice_mode',
  ONBOARDING_STEP: 'onboarding_step',
  ONBOARDING_ANSWER: 'onboarding_answer',
  
  // System-focused actions
  VIEW_LOGS: 'view_logs',
  SYSTEM_CONFIG: 'system_config',
  HEALTH_CHECK: 'health_check',
  AUDIT_TRAIL_VIEW: 'audit_trail_view',
  
  // Universal actions
  LOGIN: 'login',
  DASHBOARD_VIEW: 'dashboard_view',
  DATA_UPLOAD: 'data_upload',
  REPORT_GENERATE: 'report_generate',
} as const;

export type BehaviorAction = typeof BEHAVIOR_ACTIONS[keyof typeof BEHAVIOR_ACTIONS];