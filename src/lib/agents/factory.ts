import { 
  Agent, 
  AgentType, 
  BaseAgent,
  InventoryMonitorConfig,
  AlertGeneratorConfig,
  DataProcessorConfig,
  ReportGeneratorConfig,
  OptimizationEngineConfig,
  NotificationDispatcherConfig
} from './types';
import { InventoryMonitor } from './implementations/inventory-monitor';
import { AlertGenerator } from './implementations/alert-generator';
import { DataProcessor } from './implementations/data-processor';
import { ReportGenerator } from './implementations/report-generator';
import { OptimizationEngine } from './implementations/optimization-engine';
import { NotificationDispatcher } from './implementations/notification-dispatcher';

export class AgentFactory {
  private static instance: AgentFactory;

  private constructor() {}

  static getInstance(): AgentFactory {
    if (!AgentFactory.instance) {
      AgentFactory.instance = new AgentFactory();
    }
    return AgentFactory.instance;
  }

  createAgent(agent: Agent): BaseAgent {
    switch (agent.type) {
      case 'inventory_monitor':
        return new InventoryMonitor(agent);
      
      case 'alert_generator':
        return new AlertGenerator(agent);
      
      case 'data_processor':
        return new DataProcessor(agent);
      
      case 'report_generator':
        return new ReportGenerator(agent);
      
      case 'optimization_engine':
        return new OptimizationEngine(agent);
      
      case 'notification_dispatcher':
        return new NotificationDispatcher(agent);
      
      default:
        throw new Error(`Unknown agent type: ${agent.type}`);
    }
  }

  validateConfig(type: AgentType, config: any): boolean {
    switch (type) {
      case 'inventory_monitor':
        return this.validateInventoryMonitorConfig(config);
      
      case 'alert_generator':
        return this.validateAlertGeneratorConfig(config);
      
      case 'data_processor':
        return this.validateDataProcessorConfig(config);
      
      case 'report_generator':
        return this.validateReportGeneratorConfig(config);
      
      case 'optimization_engine':
        return this.validateOptimizationEngineConfig(config);
      
      case 'notification_dispatcher':
        return this.validateNotificationDispatcherConfig(config);
      
      default:
        return false;
    }
  }

  private validateInventoryMonitorConfig(config: any): boolean {
    const typedConfig = config as InventoryMonitorConfig;
    return !!(
      typedConfig.thresholds &&
      typeof typedConfig.thresholds.low === 'number' &&
      typeof typedConfig.thresholds.critical === 'number' &&
      typeof typedConfig.checkInterval === 'number' &&
      typedConfig.checkInterval > 0
    );
  }

  private validateAlertGeneratorConfig(config: any): boolean {
    const typedConfig = config as AlertGeneratorConfig;
    return !!(
      Array.isArray(typedConfig.alertTypes) &&
      typedConfig.alertTypes.length > 0 &&
      Array.isArray(typedConfig.recipients) &&
      typedConfig.recipients.length > 0 &&
      ['low', 'medium', 'high', 'critical'].includes(typedConfig.priority) &&
      typeof typedConfig.cooldownPeriod === 'number' &&
      typedConfig.cooldownPeriod >= 0
    );
  }

  private validateDataProcessorConfig(config: any): boolean {
    const typedConfig = config as DataProcessorConfig;
    return !!(
      typedConfig.source &&
      ['csv', 'json', 'xml'].includes(typedConfig.format) &&
      Array.isArray(typedConfig.transformations) &&
      typedConfig.destination
    );
  }

  private validateReportGeneratorConfig(config: any): boolean {
    const typedConfig = config as ReportGeneratorConfig;
    return !!(
      typedConfig.reportType &&
      ['daily', 'weekly', 'monthly'].includes(typedConfig.schedule) &&
      Array.isArray(typedConfig.recipients) &&
      typedConfig.recipients.length > 0 &&
      ['pdf', 'excel', 'csv'].includes(typedConfig.format) &&
      typeof typedConfig.includeCharts === 'boolean'
    );
  }

  private validateOptimizationEngineConfig(config: any): boolean {
    const typedConfig = config as OptimizationEngineConfig;
    return !!(
      ['inventory', 'route', 'cost', 'time'].includes(typedConfig.optimizationType) &&
      typedConfig.constraints &&
      typeof typedConfig.constraints === 'object' &&
      Array.isArray(typedConfig.objectives) &&
      typedConfig.objectives.length > 0 &&
      typeof typedConfig.maxIterations === 'number' &&
      typedConfig.maxIterations > 0
    );
  }

  private validateNotificationDispatcherConfig(config: any): boolean {
    const typedConfig = config as NotificationDispatcherConfig;
    const validChannels = ['email', 'sms', 'webhook', 'in-app'];
    return !!(
      Array.isArray(typedConfig.channels) &&
      typedConfig.channels.length > 0 &&
      typedConfig.channels.every(channel => validChannels.includes(channel)) &&
      typedConfig.templates &&
      typeof typedConfig.templates === 'object' &&
      typeof typedConfig.retryAttempts === 'number' &&
      typedConfig.retryAttempts >= 0 &&
      typeof typedConfig.retryDelay === 'number' &&
      typedConfig.retryDelay >= 0
    );
  }

  getDefaultConfig(type: AgentType): any {
    switch (type) {
      case 'inventory_monitor':
        return {
          thresholds: { low: 10, critical: 5 },
          checkInterval: 60,
          itemsToMonitor: []
        };
      
      case 'alert_generator':
        return {
          alertTypes: ['critical'],
          recipients: [],
          priority: 'medium',
          cooldownPeriod: 30
        };
      
      case 'data_processor':
        return {
          source: '',
          format: 'csv',
          transformations: [],
          destination: ''
        };
      
      case 'report_generator':
        return {
          reportType: 'summary',
          schedule: 'daily',
          recipients: [],
          format: 'pdf',
          includeCharts: true
        };
      
      case 'optimization_engine':
        return {
          optimizationType: 'inventory',
          constraints: {},
          objectives: ['minimize_cost'],
          maxIterations: 1000
        };
      
      case 'notification_dispatcher':
        return {
          channels: ['email'],
          templates: {},
          retryAttempts: 3,
          retryDelay: 60
        };
      
      default:
        return {};
    }
  }
}