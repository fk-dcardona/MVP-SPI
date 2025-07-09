export type AgentType = 
  | 'inventory_monitor'
  | 'alert_generator'
  | 'data_processor'
  | 'report_generator'
  | 'optimization_engine'
  | 'notification_dispatcher';

export type AgentStatus = 'active' | 'inactive' | 'running' | 'error' | 'paused';

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentConfig {
  [key: string]: any;
}

export interface Agent {
  id: string;
  company_id: string;
  type: AgentType;
  name: string;
  description?: string;
  config: AgentConfig;
  status: AgentStatus;
  next_run?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface AgentExecution {
  id: string;
  agent_id: string;
  status: ExecutionStatus;
  started_at: Date;
  completed_at?: Date;
  error?: string;
  result?: any;
}

export interface AgentMetrics {
  agent_id: string;
  total_executions: number;
  successful_executions: number;
  failed_executions: number;
  average_execution_time: number;
  last_success_at?: Date;
  last_failure_at?: Date;
  uptime_percentage: number;
}

export interface AgentExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
}

export abstract class BaseAgent {
  protected agent: Agent;

  constructor(agent: Agent) {
    this.agent = agent;
  }

  abstract execute(): Promise<AgentExecutionResult>;
  abstract validate(): boolean;
  
  getConfig<T = any>(key: string, defaultValue?: T): T {
    return this.agent.config[key] ?? defaultValue;
  }

  getId(): string {
    return this.agent.id;
  }

  getType(): AgentType {
    return this.agent.type;
  }

  getName(): string {
    return this.agent.name;
  }
}

export interface InventoryMonitorConfig {
  thresholds: {
    low: number;
    critical: number;
  };
  checkInterval: number; // minutes
  itemsToMonitor?: string[];
}

export interface AlertGeneratorConfig {
  alertTypes: string[];
  recipients: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  cooldownPeriod: number; // minutes
}

export interface DataProcessorConfig {
  source: string;
  format: 'csv' | 'json' | 'xml';
  transformations: Array<{
    field: string;
    operation: string;
    params?: any;
  }>;
  destination: string;
}

export interface ReportGeneratorConfig {
  reportType: string;
  schedule: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  includeCharts: boolean;
}

export interface OptimizationEngineConfig {
  optimizationType: 'inventory' | 'route' | 'cost' | 'time';
  constraints: Record<string, any>;
  objectives: string[];
  maxIterations: number;
  autoApply?: boolean;
}

export interface NotificationDispatcherConfig {
  channels: Array<'email' | 'sms' | 'webhook' | 'in-app'>;
  templates: Record<string, string>;
  retryAttempts: number;
  retryDelay: number; // seconds
}