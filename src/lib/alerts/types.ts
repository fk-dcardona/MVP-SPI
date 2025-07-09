export interface AlertRule {
  id: string;
  company_id: string;
  name: string;
  description?: string;
  
  // Trigger Configuration
  trigger_type: AlertTriggerType;
  metric: string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'changes_by';
  threshold_value: number;
  threshold_unit?: string;
  
  // Conditions
  conditions?: AlertCondition[];
  condition_logic?: 'AND' | 'OR';
  
  // Actions
  severity: 'critical' | 'high' | 'medium' | 'low';
  notification_channels: NotificationChannel[];
  
  // Scheduling
  check_frequency: CheckFrequency;
  active_hours?: {
    start: string; // HH:MM format
    end: string;
    timezone: string;
  };
  
  // State
  enabled: boolean;
  last_triggered?: Date;
  trigger_count: number;
  
  // Cooldown
  cooldown_minutes?: number;
  next_eligible_trigger?: Date;
  
  created_at: Date;
  updated_at: Date;
}

export interface AlertCondition {
  metric: string;
  operator: string;
  value: any;
}

export type AlertTriggerType = 
  | 'metric_threshold'
  | 'inventory_level'
  | 'stockout_risk'
  | 'supplier_performance'
  | 'financial_metric'
  | 'order_status'
  | 'system_event';

export type CheckFrequency = 
  | 'real_time'
  | 'every_5_minutes'
  | 'every_15_minutes'
  | 'every_30_minutes'
  | 'hourly'
  | 'daily';

export interface NotificationChannel {
  type: 'email' | 'sms' | 'whatsapp' | 'in_app' | 'webhook';
  recipients: string[];
  template_id?: string;
  settings?: Record<string, any>;
}

export interface AlertInstance {
  id: string;
  rule_id: string;
  company_id: string;
  
  // Alert Details
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  
  // Trigger Information
  triggered_at: Date;
  trigger_value: any;
  trigger_context: Record<string, any>;
  
  // Status
  status: 'active' | 'acknowledged' | 'resolved' | 'expired';
  acknowledged_by?: string;
  acknowledged_at?: Date;
  resolved_by?: string;
  resolved_at?: Date;
  
  // Notifications
  notifications_sent: NotificationRecord[];
  
  // Related Data
  related_entity_type?: string;
  related_entity_id?: string;
}

export interface NotificationRecord {
  channel: string;
  recipient: string;
  sent_at: Date;
  status: 'sent' | 'failed' | 'pending';
  error?: string;
}

export interface AlertTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  
  // Pre-configured rule settings
  default_rule: Partial<AlertRule>;
  
  // Customizable parameters
  parameters: AlertParameter[];
  
  // Example use cases
  use_cases: string[];
}

export interface AlertParameter {
  name: string;
  label: string;
  type: 'number' | 'string' | 'boolean' | 'select';
  required: boolean;
  default_value?: any;
  options?: Array<{ value: any; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface AlertSummary {
  total_rules: number;
  active_rules: number;
  
  alerts_by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  
  alerts_by_status: {
    active: number;
    acknowledged: number;
    resolved: number;
  };
  
  recent_alerts: AlertInstance[];
  
  top_triggered_rules: Array<{
    rule: AlertRule;
    trigger_count: number;
    last_triggered: Date;
  }>;
}

// Pre-defined alert templates
export const ALERT_TEMPLATES: AlertTemplate[] = [
  {
    id: 'low-inventory',
    name: 'Low Inventory Alert',
    category: 'Inventory',
    description: 'Triggered when inventory falls below a specified threshold',
    default_rule: {
      trigger_type: 'inventory_level',
      metric: 'quantity_on_hand',
      operator: 'less_than',
      severity: 'high',
      check_frequency: 'every_15_minutes',
      notification_channels: [{ type: 'email', recipients: [] }]
    },
    parameters: [
      {
        name: 'threshold',
        label: 'Minimum Quantity',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        name: 'sku',
        label: 'SKU (leave empty for all)',
        type: 'string',
        required: false
      }
    ],
    use_cases: [
      'Prevent stockouts for critical items',
      'Maintain minimum safety stock levels',
      'Trigger reorder processes'
    ]
  },
  {
    id: 'supplier-performance',
    name: 'Supplier Performance Alert',
    category: 'Suppliers',
    description: 'Alert when supplier performance drops below acceptable levels',
    default_rule: {
      trigger_type: 'supplier_performance',
      metric: 'overall_score',
      operator: 'less_than',
      severity: 'medium',
      check_frequency: 'daily',
      notification_channels: [{ type: 'email', recipients: [] }]
    },
    parameters: [
      {
        name: 'threshold_score',
        label: 'Minimum Performance Score',
        type: 'number',
        required: true,
        default_value: 70,
        validation: { min: 0, max: 100 }
      },
      {
        name: 'supplier_id',
        label: 'Supplier (leave empty for all)',
        type: 'string',
        required: false
      }
    ],
    use_cases: [
      'Monitor critical supplier relationships',
      'Identify performance degradation early',
      'Trigger supplier review processes'
    ]
  },
  {
    id: 'cash-flow-alert',
    name: 'Cash Flow Warning',
    category: 'Financial',
    description: 'Alert when projected cash position falls below threshold',
    default_rule: {
      trigger_type: 'financial_metric',
      metric: 'projected_cash_position',
      operator: 'less_than',
      severity: 'critical',
      check_frequency: 'daily',
      notification_channels: [
        { type: 'email', recipients: [] },
        { type: 'sms', recipients: [] }
      ]
    },
    parameters: [
      {
        name: 'cash_threshold',
        label: 'Minimum Cash Position',
        type: 'number',
        required: true,
        validation: { min: 0 }
      },
      {
        name: 'forecast_days',
        label: 'Days to Forecast',
        type: 'number',
        required: true,
        default_value: 30,
        validation: { min: 1, max: 90 }
      }
    ],
    use_cases: [
      'Prevent cash shortages',
      'Plan financing needs in advance',
      'Manage working capital proactively'
    ]
  }
];