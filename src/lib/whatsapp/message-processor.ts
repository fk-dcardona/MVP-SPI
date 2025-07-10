import { WhatsAppService } from '@/lib/notifications/whatsapp-service';
import { AgentManager } from '@/lib/agents/manager';
import { AgentType } from '@/lib/agents/types';
import { createServerClient } from '@/lib/supabase/server';
import { PersonaService } from '@/services/persona-service';
import { UserPersona } from '@/types/persona';

// Intent types for natural language understanding
export enum IntentType {
  // Inventory Management
  CHECK_INVENTORY = "check_inventory",
  REORDER_STOCK = "reorder_stock",
  UPDATE_STOCK = "update_stock",
  
  // Alert Management  
  VIEW_ALERTS = "view_alerts",
  ACKNOWLEDGE_ALERT = "acknowledge_alert",
  RESOLVE_ALERT = "resolve_alert",
  
  // Reporting
  GENERATE_REPORT = "generate_report",
  VIEW_METRICS = "view_metrics",
  DAILY_DIGEST = "daily_digest",
  
  // Supplier Management
  CHECK_SUPPLIER = "check_supplier",
  SUPPLIER_PERFORMANCE = "supplier_performance",
  
  // Agent Control
  RUN_AGENT = "run_agent",
  STOP_AGENT = "stop_agent",
  AGENT_STATUS = "agent_status",
  
  // General
  HELP = "help",
  UNKNOWN = "unknown"
}

interface Intent {
  type: IntentType;
  confidence: number;
  entities: Record<string, any>;
  rawText: string;
}

interface WhatsAppMessage {
  from: string;
  to: string;
  body: string;
  messageSid: string;
  profileName?: string;
}

interface AgentMapping {
  intent: IntentType;
  agentType: AgentType;
  requiredEntities: string[];
  defaultConfig?: Record<string, any>;
  responseTemplate: string;
}

// Intent patterns for natural language understanding
const INTENT_PATTERNS: Record<IntentType, RegExp[]> = {
  [IntentType.CHECK_INVENTORY]: [
    /check (?:inventory|stock) (?:for|of) (.+)/i,
    /how (?:much|many) (.+) (?:do we have|in stock)/i,
    /(?:inventory|stock) (?:level|status) (.+)/i,
    /^stock (.+)$/i
  ],
  
  [IntentType.VIEW_ALERTS]: [
    /(?:show|view|list) (?:my |all )?alerts?/i,
    /what alerts? (?:do I have|are active)/i,
    /^alerts?$/i
  ],
  
  [IntentType.REORDER_STOCK]: [
    /(?:reorder|order|purchase) (.+)/i,
    /create (?:po|purchase order) (?:for )?(.+)/i,
    /need (?:to order|more) (.+)/i
  ],
  
  [IntentType.ACKNOWLEDGE_ALERT]: [
    /^ack(?:nowledge)?$/i,
    /acknowledge alert (\w+)/i
  ],
  
  [IntentType.GENERATE_REPORT]: [
    /generate (.+) report/i,
    /(?:create|make|build) report (?:for|on) (.+)/i,
    /(.+) report (?:for )?(today|yesterday|this week|last week)/i
  ],
  
  [IntentType.HELP]: [
    /^help$/i,
    /what can (?:you|i) do/i,
    /show (?:me )?commands/i,
    /^commands?$/i
  ],
  
  [IntentType.DAILY_DIGEST]: [
    /daily (?:digest|summary|report)/i,
    /send (?:me )?(?:my )?digest/i,
    /^digest$/i
  ],
  
  [IntentType.CHECK_SUPPLIER]: [
    /(?:check|show) supplier (.+)/i,
    /supplier (?:info|information|details) (.+)/i,
    /^supplier (.+)$/i
  ],
  
  [IntentType.AGENT_STATUS]: [
    /agent (?:status|info)/i,
    /(?:show|list) (?:running )?agents/i,
    /what agents are running/i
  ]
};

// Agent mappings for each intent
const AGENT_MAPPINGS: AgentMapping[] = [
  {
    intent: IntentType.CHECK_INVENTORY,
    agentType: 'inventory_monitor',
    requiredEntities: ['product'],
    responseTemplate: 'inventory_check_result'
  },
  {
    intent: IntentType.VIEW_ALERTS,
    agentType: 'alert_generator',
    requiredEntities: [],
    defaultConfig: { priority: 'high' },
    responseTemplate: 'alert_summary'
  },
  {
    intent: IntentType.GENERATE_REPORT,
    agentType: 'report_generator',
    requiredEntities: ['report_type'],
    defaultConfig: { format: 'pdf' },
    responseTemplate: 'report_ready'
  },
  {
    intent: IntentType.DAILY_DIGEST,
    agentType: 'report_generator',
    requiredEntities: [],
    defaultConfig: { 
      report_type: 'daily_digest',
      format: 'summary'
    },
    responseTemplate: 'daily_digest'
  },
  {
    intent: IntentType.CHECK_SUPPLIER,
    agentType: 'data_processor',
    requiredEntities: ['supplier_name'],
    responseTemplate: 'supplier_info'
  }
];

export class WhatsAppMessageProcessor {
  private whatsappService: WhatsAppService;
  private agentManager: AgentManager;
  private personaService: PersonaService;

  constructor() {
    this.whatsappService = new WhatsAppService();
    this.agentManager = AgentManager.getInstance();
    this.personaService = new PersonaService();
  }

  async processMessage(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from.replace('whatsapp:', '');
    
    try {
      // Send processing acknowledgment
      await this.whatsappService.sendMessage({
        to: phoneNumber,
        body: '⏳ Processing your request...'
      });

      // Get user from phone number
      const user = await this.getUserFromPhone(phoneNumber);
      if (!user) {
        await this.sendAuthenticationRequired(phoneNumber);
        return;
      }

      // Get user's persona
      const persona = await this.personaService.getPersona(user.id);

      // Parse intent and entities
      const intent = this.extractIntent(message.body);
      console.log('Extracted intent:', intent);

      // Update conversation with intent
      await this.updateConversationIntent(message.messageSid, intent);

      // Handle the intent
      await this.handleIntent(intent, user, persona, phoneNumber);

    } catch (error) {
      console.error('Error processing WhatsApp message:', error);
      await this.sendErrorResponse(phoneNumber);
    }
  }

  private extractIntent(text: string): Intent {
    const normalizedText = text.trim().toLowerCase();
    
    // Check each intent pattern
    for (const [intentType, patterns] of Object.entries(INTENT_PATTERNS)) {
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          return {
            type: intentType as IntentType,
            confidence: 0.9,
            entities: this.extractEntities(text, intentType as IntentType, match),
            rawText: text
          };
        }
      }
    }

    // Default to unknown
    return {
      type: IntentType.UNKNOWN,
      confidence: 0.1,
      entities: {},
      rawText: text
    };
  }

  private extractEntities(text: string, intentType: IntentType, match: RegExpMatchArray): Record<string, any> {
    const entities: Record<string, any> = {};

    switch (intentType) {
      case IntentType.CHECK_INVENTORY:
        if (match[1]) {
          entities.product = match[1].trim();
          // Try to extract SKU pattern
          const skuMatch = match[1].match(/[A-Z0-9]{3,}-?[A-Z0-9]*/);
          if (skuMatch) {
            entities.sku = skuMatch[0];
          }
        }
        break;

      case IntentType.GENERATE_REPORT:
        // Extract report type
        const reportTypes = ['inventory', 'sales', 'supplier', 'financial'];
        for (const type of reportTypes) {
          if (text.toLowerCase().includes(type)) {
            entities.report_type = type;
            break;
          }
        }
        
        // Extract date range
        entities.date_range = this.extractDateRange(text);
        break;

      case IntentType.CHECK_SUPPLIER:
        if (match[1]) {
          entities.supplier_name = match[1].trim();
        }
        break;

      case IntentType.REORDER_STOCK:
        if (match[1]) {
          entities.product = match[1].trim();
          // Try to extract quantity
          const qtyMatch = text.match(/(\d+)\s*(?:units?|pieces?|items?)/);
          if (qtyMatch) {
            entities.quantity = parseInt(qtyMatch[1]);
          }
        }
        break;
    }

    return entities;
  }

  private extractDateRange(text: string): { start: Date; end: Date } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const ranges: Record<string, () => { start: Date; end: Date }> = {
      'today': () => {
        const end = new Date(today);
        end.setHours(23, 59, 59, 999);
        return { start: today, end };
      },
      'yesterday': () => {
        const start = new Date(today);
        start.setDate(start.getDate() - 1);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      },
      'this week': () => {
        const start = new Date(today);
        start.setDate(start.getDate() - start.getDay());
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      },
      'last week': () => {
        const start = new Date(today);
        start.setDate(start.getDate() - start.getDay() - 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
    };

    for (const [key, fn] of Object.entries(ranges)) {
      if (text.toLowerCase().includes(key)) {
        return fn();
      }
    }

    // Default to today
    return ranges['today']();
  }

  private async handleIntent(
    intent: Intent,
    user: any,
    persona: UserPersona,
    phoneNumber: string
  ): Promise<void> {
    // Handle special intents
    if (intent.type === IntentType.HELP) {
      await this.sendHelpMessage(phoneNumber, persona);
      return;
    }

    if (intent.type === IntentType.UNKNOWN) {
      await this.sendUnknownCommandResponse(phoneNumber, persona);
      return;
    }

    // Find agent mapping
    const mapping = AGENT_MAPPINGS.find(m => m.intent === intent.type);
    if (!mapping) {
      await this.sendUnknownCommandResponse(phoneNumber, persona);
      return;
    }

    // Validate required entities
    const missingEntities = mapping.requiredEntities.filter(
      entity => !intent.entities[entity]
    );

    if (missingEntities.length > 0) {
      await this.sendClarificationRequest(phoneNumber, missingEntities, persona);
      return;
    }

    // Execute agent
    try {
      const result = await this.executeAgent(
        mapping.agentType,
        user,
        intent,
        mapping.defaultConfig
      );

      // Send response based on persona
      await this.sendAgentResponse(
        phoneNumber,
        result,
        persona,
        mapping.responseTemplate
      );

    } catch (error) {
      console.error('Error executing agent:', error);
      await this.sendAgentErrorResponse(phoneNumber, persona);
    }
  }

  private async executeAgent(
    agentType: AgentType,
    user: any,
    intent: Intent,
    defaultConfig?: Record<string, any>
  ): Promise<any> {
    // Find or create agent
    const supabase = createServerClient();
    
    const { data: agent } = await supabase
      .from('agents')
      .select('*')
      .eq('company_id', user.company_id)
      .eq('type', agentType)
      .eq('status', 'active')
      .single();

    if (!agent) {
      throw new Error(`No active ${agentType} agent found`);
    }

    // Execute with context
    const context = {
      intent,
      source: 'whatsapp',
      user_id: user.id,
      company_id: user.company_id,
      config: {
        ...defaultConfig,
        ...intent.entities
      }
    };

    const execution = await this.agentManager.executeAgent(agent.id, context);
    return execution.result;
  }

  private async sendAgentResponse(
    phoneNumber: string,
    result: any,
    persona: UserPersona,
    templateName: string
  ): Promise<void> {
    const response = this.buildPersonaResponse(result, persona, templateName);
    
    await this.whatsappService.sendMessage({
      to: phoneNumber,
      body: response
    });
  }

  private buildPersonaResponse(
    result: any,
    persona: UserPersona,
    templateName: string
  ): string {
    // Persona-specific response templates
    const templates = {
      streamliner: {
        inventory_check_result: (data: any) => 
          `📦 ${data.sku || data.product}: ${data.quantity || 0} units\n` +
          `📍 ${data.location || 'Main'}\n` +
          `${data.quantity < data.reorder_point ? '⚠️ Reorder needed!' : '✅ Stock OK'}`,
        
        alert_summary: (data: any) =>
          `🚨 ${data.total || 0} alerts\n` +
          `Critical: ${data.critical || 0}\n` +
          `Reply # for details`,
        
        report_ready: (data: any) =>
          `✅ Report ready!\n` +
          `📊 ${data.link || 'Check dashboard'}\n` +
          `📧 Sent to ${data.email || 'your email'}`,
          
        daily_digest: (data: any) =>
          `📊 Daily Summary\n` +
          `Alerts: ${data.alerts || 0}\n` +
          `Orders: ${data.orders || 0}\n` +
          `Cash: $${data.cash || 0}`
      },

      navigator: {
        inventory_check_result: (data: any) => 
          `📊 **Inventory Analysis**\n\n` +
          `Product: ${data.product || data.sku}\n` +
          `Current: ${data.quantity || 0} units\n` +
          `Reorder: ${data.reorder_point || 'Not set'}\n` +
          `Lead Time: ${data.lead_time || 'Unknown'} days\n\n` +
          `Status: ${data.quantity < data.reorder_point ? '⚠️ Below reorder point' : '✅ Adequate stock'}`,
        
        alert_summary: (data: any) =>
          `📋 **Alert Dashboard**\n\n` +
          `Total Active: ${data.total || 0}\n\n` +
          `By Severity:\n` +
          `🔴 Critical: ${data.critical || 0}\n` +
          `🟠 High: ${data.high || 0}\n` +
          `🟡 Medium: ${data.medium || 0}\n` +
          `🟢 Low: ${data.low || 0}\n\n` +
          `Reply with alert ID for details`,
          
        report_ready: (data: any) =>
          `📊 **Report Generated**\n\n` +
          `Type: ${data.report_type}\n` +
          `Period: ${data.period}\n` +
          `Format: ${data.format}\n\n` +
          `Access: ${data.link}\n` +
          `Actions: SHARE | SCHEDULE`,
          
        daily_digest: (data: any) =>
          `📊 **Daily Operations Summary**\n\n` +
          `Key Metrics:\n` +
          `• Active Alerts: ${data.alerts || 0}\n` +
          `• Pending Orders: ${data.orders || 0}\n` +
          `• Cash Position: $${data.cash || 0}\n` +
          `• Inventory Value: $${data.inventory_value || 0}\n\n` +
          `View full dashboard for details`
      },

      hub: {
        inventory_check_result: (data: any) => 
          `🏢 **Network Inventory Status**\n\n` +
          `Product: ${data.product || data.sku}\n\n` +
          `Entity Breakdown:\n` +
          `${data.entities?.map((e: any) => 
            `• ${e.name}: ${e.quantity} units`
          ).join('\n') || 'No entity data'}\n\n` +
          `Total Network: ${data.total_quantity || 0} units`,
        
        alert_summary: (data: any) =>
          `🏢 **Network Alerts**\n\n` +
          `Total Across Entities: ${data.total || 0}\n\n` +
          `By Entity:\n` +
          `${data.by_entity?.map((e: any) => 
            `• ${e.name}: ${e.count} alerts`
          ).join('\n') || 'No entity breakdown'}`,
          
        daily_digest: (data: any) =>
          `🏢 **Network Summary**\n\n` +
          `Entities: ${data.entity_count || 0}\n` +
          `Total Alerts: ${data.alerts || 0}\n` +
          `Network Cash: $${data.total_cash || 0}\n` +
          `Top Issue: ${data.top_issue || 'None'}`
      },

      spring: {
        inventory_check_result: (data: any) => 
          `📚 **Learning: Inventory Check**\n\n` +
          `You checked: ${data.product || data.sku}\n` +
          `Result: ${data.quantity || 0} units\n\n` +
          `💡 Tip: Reorder point (${data.reorder_point || 'not set'}) helps maintain stock!\n` +
          `Reply LEARN for more`,
        
        alert_summary: (data: any) =>
          `📚 **Understanding Alerts**\n\n` +
          `You have ${data.total || 0} active alerts\n\n` +
          `What alerts mean:\n` +
          `🔴 Critical = Immediate action\n` +
          `🟠 High = Action today\n` +
          `🟡 Medium = Plan action\n` +
          `🟢 Low = Monitor\n\n` +
          `Reply HELP for alert management`,
          
        daily_digest: (data: any) =>
          `📚 **Your Daily Learning Summary**\n\n` +
          `Today's Performance:\n` +
          `• Alerts handled: ${data.alerts_resolved || 0}\n` +
          `• Orders placed: ${data.orders || 0}\n` +
          `• Cash flow: $${data.cash || 0}\n\n` +
          `🎯 Tomorrow's focus: ${data.suggestion || 'Check critical alerts'}`
      },

      processor: {
        inventory_check_result: (data: any) => 
          `[INVENTORY_QUERY]\n` +
          `SKU: ${data.sku || data.product}\n` +
          `QTY: ${data.quantity || 0}\n` +
          `LOC: ${data.location || 'MAIN'}\n` +
          `REORDER: ${data.reorder_point || 0}\n` +
          `STATUS: ${data.quantity < data.reorder_point ? 'REORDER_REQUIRED' : 'OK'}\n` +
          `TIMESTAMP: ${new Date().toISOString()}`,
        
        alert_summary: (data: any) =>
          `[ALERT_SUMMARY]\n` +
          `TOTAL: ${data.total || 0}\n` +
          `CRITICAL: ${data.critical || 0}\n` +
          `HIGH: ${data.high || 0}\n` +
          `MEDIUM: ${data.medium || 0}\n` +
          `LOW: ${data.low || 0}\n` +
          `QUERY_TIME: ${data.query_time || 0}ms`,
          
        daily_digest: (data: any) =>
          `[DAILY_METRICS]\n` +
          `DATE: ${new Date().toISOString().split('T')[0]}\n` +
          `ALERTS: ${data.alerts || 0}\n` +
          `ORDERS: ${data.orders || 0}\n` +
          `CASH: ${data.cash || 0}\n` +
          `INV_VALUE: ${data.inventory_value || 0}\n` +
          `PROCESSING_TIME: ${data.processing_time || 0}ms`
      }
    };

    // Get template for persona
    const personaTemplates = templates[persona] || templates.streamliner;
    const templateFn = personaTemplates[templateName] || ((data: any) => JSON.stringify(data));
    
    return templateFn(result);
  }

  private async sendHelpMessage(phoneNumber: string, persona: UserPersona): Promise<void> {
    const helpMessages = {
      streamliner: 
        `⚡ Quick Commands:\n\n` +
        `📦 stock [SKU] - Check inventory\n` +
        `🚨 alerts - View active alerts\n` +
        `📊 report - Generate report\n` +
        `📋 digest - Daily summary\n` +
        `🛒 order [product] - Create PO\n` +
        `❓ help - This message`,

      navigator:
        `🎯 **Command Center**\n\n` +
        `**Inventory:**\n` +
        `• check stock [SKU/product]\n` +
        `• inventory status [product]\n\n` +
        `**Alerts:**\n` +
        `• view alerts\n` +
        `• acknowledge alert [ID]\n\n` +
        `**Reports:**\n` +
        `• generate [type] report\n` +
        `• daily digest\n\n` +
        `**Suppliers:**\n` +
        `• supplier [name]\n` +
        `• supplier performance`,

      hub:
        `🏢 **Network Commands**\n\n` +
        `• stock [SKU] - Network inventory\n` +
        `• alerts - All entity alerts\n` +
        `• report - Consolidated report\n` +
        `• digest - Network summary\n` +
        `• supplier [name] - Supplier info\n\n` +
        `All commands show network-wide data`,

      spring:
        `📚 **Available Commands**\n\n` +
        `Let me help you learn! Try:\n\n` +
        `• "check stock ABC123" 📦\n` +
        `• "show alerts" 🚨\n` +
        `• "daily report" 📊\n` +
        `• "order product" 🛒\n\n` +
        `💡 Tip: Use natural language!\n` +
        `Example: "How much stock do we have of Product A?"`,

      processor:
        `[COMMAND_LIST]\n` +
        `INVENTORY: stock [SKU]\n` +
        `ALERTS: alerts\n` +
        `REPORTS: report [type]\n` +
        `DIGEST: digest\n` +
        `SUPPLIER: supplier [name]\n` +
        `HELP: help\n` +
        `[END_COMMAND_LIST]`
    };

    const message = helpMessages[persona] || helpMessages.streamliner;
    
    await this.whatsappService.sendMessage({
      to: phoneNumber,
      body: message
    });
  }

  private async sendUnknownCommandResponse(phoneNumber: string, persona: UserPersona): Promise<void> {
    const responses = {
      streamliner: 
        `❓ Unknown command\n\n` +
        `Try: stock, alerts, report, help`,

      navigator:
        `⚠️ Command not recognized\n\n` +
        `Available commands:\n` +
        `• check stock [product]\n` +
        `• view alerts\n` +
        `• generate report\n` +
        `• help\n\n` +
        `Use natural language or exact commands`,

      spring:
        `🤔 I didn't understand that!\n\n` +
        `Here are some examples:\n` +
        `• "check stock ABC123"\n` +
        `• "show me alerts"\n` +
        `• "I need a report"\n\n` +
        `💡 Just tell me what you need!`,

      hub:
        `❌ Command not found\n\n` +
        `Network commands: stock, alerts, report, digest`,

      processor:
        `[ERROR] UNKNOWN_COMMAND\n` +
        `USE: help`
    };

    const message = responses[persona] || responses.streamliner;
    
    await this.whatsappService.sendMessage({
      to: phoneNumber,
      body: message
    });
  }

  private async sendClarificationRequest(
    phoneNumber: string, 
    missingEntities: string[],
    persona: UserPersona
  ): Promise<void> {
    const entityPrompts: Record<string, string> = {
      product: 'Which product? (name or SKU)',
      report_type: 'What type? (inventory/sales/supplier/financial)',
      supplier_name: 'Which supplier?',
      date_range: 'What period? (today/yesterday/this week/last week)',
      quantity: 'How many units?'
    };

    let message = '';
    const missing = missingEntities.map(e => entityPrompts[e] || e).join(', ');

    switch (persona) {
      case 'streamliner':
        message = `❓ Need: ${missing}`;
        break;
      case 'navigator':
        message = `⚠️ **Missing Information**\n\nPlease provide: ${missing}`;
        break;
      case 'spring':
        message = `🤔 I need a bit more info!\n\n${missing}\n\n💡 Example: "check stock ABC123"`;
        break;
      case 'hub':
        message = `🏢 Network query needs: ${missing}`;
        break;
      case 'processor':
        message = `[MISSING_PARAMS] ${missingEntities.join(',')}`;
        break;
      default:
        message = `Missing: ${missing}`;
    }

    await this.whatsappService.sendMessage({
      to: phoneNumber,
      body: message
    });
  }

  private async sendErrorResponse(phoneNumber: string): Promise<void> {
    await this.whatsappService.sendMessage({
      to: phoneNumber,
      body: '⚠️ Sorry, something went wrong. Please try again or contact support.'
    });
  }

  private async sendAgentErrorResponse(phoneNumber: string, persona: UserPersona): Promise<void> {
    const responses = {
      streamliner: '⚠️ Processing failed. Try again.',
      navigator: '⚠️ **Agent Execution Failed**\n\nThe requested operation could not be completed. Please try again or check system status.',
      spring: '😔 Oops! Something went wrong.\n\nDon\'t worry, this happens sometimes. Try again or ask for help!',
      hub: '⚠️ Network operation failed. Check entity connections.',
      processor: '[ERROR] AGENT_EXECUTION_FAILED'
    };

    const message = responses[persona] || responses.streamliner;
    
    await this.whatsappService.sendMessage({
      to: phoneNumber,
      body: message
    });
  }

  private async sendAuthenticationRequired(phoneNumber: string): Promise<void> {
    await this.whatsappService.sendMessage({
      to: phoneNumber,
      body: '🔒 Phone number not recognized. Please register at ' + process.env.NEXT_PUBLIC_APP_URL
    });
  }

  private async getUserFromPhone(phoneNumber: string): Promise<any> {
    const supabase = createServerClient();
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('phone', phoneNumber)
      .single();

    return data;
  }

  private async updateConversationIntent(messageSid: string, intent: Intent): Promise<void> {
    const supabase = createServerClient();
    
    await supabase
      .from('whatsapp_conversations')
      .update({
        intent_type: intent.type,
        intent_confidence: intent.confidence,
        entities: intent.entities,
        updated_at: new Date().toISOString()
      })
      .eq('message_sid', messageSid);
  }
}