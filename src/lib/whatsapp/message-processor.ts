import { WhatsAppService } from '@/lib/notifications/whatsapp-service';
import { AgentManager } from '@/lib/agents/manager';
import { AgentType } from '@/lib/agents/types';
import { createServerClient } from '@/lib/supabase/server';
import { PersonaService } from '@/services/persona-service';
import { UserPersona } from '@/types/persona';
import { ConversationStateManager, Message } from './conversation-state-manager';
import { AdaptiveResponseGenerator } from './adaptive-response-generator';
import { ProactiveInsightEngine } from './proactive-insight-engine';

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
  private conversationManager: ConversationStateManager;
  private responseGenerator: AdaptiveResponseGenerator;
  private insightEngine: ProactiveInsightEngine;

  constructor() {
    this.whatsappService = new WhatsAppService();
    this.agentManager = AgentManager.getInstance();
    this.personaService = new PersonaService();
    this.conversationManager = new ConversationStateManager();
    this.responseGenerator = new AdaptiveResponseGenerator();
    this.insightEngine = new ProactiveInsightEngine();
  }

  async processMessage(message: WhatsAppMessage): Promise<void> {
    const phoneNumber = message.from.replace('whatsapp:', '');
    
    try {
      // Get or create conversation context
      const context = await this.conversationManager.getOrCreateContext(phoneNumber);
      
      // Create message object for context
      const contextMessage: Message = {
        id: message.messageSid,
        from: message.from,
        to: message.to,
        body: message.body,
        timestamp: new Date()
      };
      
      // Check if this is a continuation of a conversation
      const { enrichedIntent, requiresClarification } = await this.conversationManager.continueConversation(
        phoneNumber,
        message.body
      );
      
      // If clarification was needed and provided
      if (enrichedIntent.type === 'clarification') {
        await this.handleClarification(enrichedIntent, context, phoneNumber);
        return;
      }
      
      // Send contextual acknowledgment based on conversation state
      const ackMessage = this.getContextualAcknowledgment(context);
      await this.whatsappService.sendMessage({
        to: phoneNumber,
        body: ackMessage
      });

      // Get user from phone number
      const user = await this.getUserFromPhone(phoneNumber);
      if (!user) {
        await this.sendAuthenticationRequired(phoneNumber);
        return;
      }

      // Parse intent with context awareness
      const intent = this.extractIntentWithContext(message.body, enrichedIntent);
      console.log('Extracted intent with context:', intent);
      
      // Add message to conversation context
      await this.conversationManager.addMessageToContext(
        phoneNumber,
        contextMessage,
        intent.type,
        intent.entities
      );

      // Check if we need clarification
      if (requiresClarification) {
        await this.requestClarification(phoneNumber, enrichedIntent, context.persona);
        return;
      }

      // Update conversation with intent
      await this.updateConversationIntent(message.messageSid, intent);

      // Handle the intent with context awareness
      await this.handleIntentWithContext(intent, user, context, phoneNumber);

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
        mapping.responseTemplate,
        intent.type
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
    templateName: string,
    intentType?: string
  ): Promise<void> {
    // Get conversation context for adaptive response generation
    const context = await this.conversationManager.getOrCreateContext(phoneNumber);
    
    // Generate adaptive response
    const response = await this.responseGenerator.generateResponse(
      result,
      context,
      intentType || templateName
    );
    
    await this.whatsappService.sendMessage({
      to: phoneNumber,
      body: response
    });
    
    // Generate insights after successful interaction
    if (context.user_id) {
      const insights = await this.insightEngine.generateInsightsForUser(context.user_id);
      
      // Send high-priority insights immediately (max 1 per conversation)
      const criticalInsight = insights.find(i => i.priority === 'critical');
      if (criticalInsight && !this.hasRecentInsight(context, 'critical')) {
        setTimeout(async () => {
          await this.insightEngine.sendProactiveInsight(criticalInsight);
        }, 10000); // Wait 10 seconds after main response
      }
    }
  }

  private hasRecentInsight(context: any, priority: string): boolean {
    // Check if we've sent a similar priority insight recently
    const recentMessages = context.context_window.slice(-5);
    return recentMessages.some((msg: any) => 
      msg.body?.includes('**') && // Insight messages have bold formatting
      (priority === 'critical' ? msg.body?.includes('🚨') : true)
    );
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

  // New context-aware methods
  private getContextualAcknowledgment(context: any): string {
    const greetings = ['👋', '✨', '🌟', '💫'];
    const isFirstMessage = context.context_window.length === 0;
    
    if (isFirstMessage) {
      const greeting = greetings[Math.floor(Math.random() * greetings.length)];
      return `${greeting} Welcome back! Processing your request...`;
    }
    
    // Check if continuing a task
    if (context.working_memory.current_task) {
      return '📋 Continuing with your request...';
    }
    
    // Default contextual response
    return '⏳ Got it, let me help with that...';
  }

  private extractIntentWithContext(text: string, enrichedIntent: any): Intent {
    // Start with basic intent extraction
    let intent = this.extractIntent(text);
    
    // Enhance with contextual information
    if (enrichedIntent.has_reference && enrichedIntent.contextual_entities) {
      intent.entities = {
        ...intent.entities,
        ...enrichedIntent.contextual_entities
      };
    }
    
    // Handle "same as" patterns
    if (enrichedIntent.reference_intent) {
      intent = {
        type: enrichedIntent.reference_intent,
        confidence: 0.8,
        entities: {
          ...enrichedIntent.reference_entities,
          ...intent.entities
        },
        rawText: text
      };
    }
    
    return intent;
  }

  private async handleClarification(
    clarificationResponse: any,
    context: any,
    phoneNumber: string
  ): Promise<void> {
    // Process the clarification response
    await this.conversationManager.resolveClarification(phoneNumber);
    
    // Rebuild the intent with clarified information
    const originalQuestion = clarificationResponse.original_question;
    const response = clarificationResponse.response;
    
    // Send confirmation
    await this.whatsappService.sendMessage({
      to: phoneNumber,
      body: `✅ Got it! ${response}. Let me process that for you...`
    });
    
    // Continue with original intent
    // This would require storing the original intent in context
  }

  private async requestClarification(
    phoneNumber: string,
    enrichedIntent: any,
    persona: UserPersona
  ): Promise<void> {
    let clarificationMessage = '';
    
    if (enrichedIntent.has_reference && !enrichedIntent.contextual_entities) {
      clarificationMessage = this.getClarificationMessage(
        'reference',
        persona,
        'Which item are you referring to?'
      );
    } else if (enrichedIntent.has_temporal && !enrichedIntent.resolved_date) {
      clarificationMessage = this.getClarificationMessage(
        'temporal',
        persona,
        'Which time period do you mean?'
      );
    } else if (enrichedIntent.has_comparison && !enrichedIntent.reference_entities) {
      clarificationMessage = this.getClarificationMessage(
        'comparison',
        persona,
        'What would you like to compare this with?'
      );
    }
    
    await this.whatsappService.sendMessage({
      to: phoneNumber,
      body: clarificationMessage
    });
    
    // Mark that we need clarification
    await this.conversationManager.addClarificationNeeded(phoneNumber, clarificationMessage);
  }

  private getClarificationMessage(
    type: string,
    persona: UserPersona,
    defaultMessage: string
  ): string {
    const messages = {
      streamliner: {
        reference: '❓ Which one?',
        temporal: '❓ When?',
        comparison: '❓ Compare with?'
      },
      navigator: {
        reference: '🎯 Could you specify which item you\'re referring to?',
        temporal: '📅 Which time period would you like me to analyze?',
        comparison: '📊 What would you like me to compare this against?'
      },
      spring: {
        reference: '🤔 I want to make sure I help with the right thing! Which item did you mean?',
        temporal: '📅 Help me understand - which dates should I look at?',
        comparison: '💡 Great question! What should I compare this with?'
      },
      hub: {
        reference: '🏢 Which entity/item are you referring to?',
        temporal: '📅 Which time period across your network?',
        comparison: '🔄 Compare with which entity or period?'
      },
      processor: {
        reference: '[CLARIFICATION_NEEDED] Specify item reference.',
        temporal: '[CLARIFICATION_NEEDED] Specify temporal parameter.',
        comparison: '[CLARIFICATION_NEEDED] Specify comparison target.'
      }
    };
    
    return messages[persona]?.[type] || defaultMessage;
  }

  private async handleIntentWithContext(
    intent: Intent,
    user: any,
    context: any,
    phoneNumber: string
  ): Promise<void> {
    // Use the context-aware persona from conversation
    const persona = context.persona;
    
    // Check if this is a repeat of a common query
    const commonQuery = context.long_term_memory.common_queries
      .find((q: any) => q.query === intent.type && q.frequency > 3);
    
    if (commonQuery) {
      // Acknowledge the pattern
      await this.whatsappService.sendMessage({
        to: phoneNumber,
        body: this.getPatternAcknowledgment(persona, intent.type)
      });
    }
    
    // Proceed with normal handling but with context awareness
    await this.handleIntent(intent, user, persona, phoneNumber);
    
    // Learn from successful interaction
    if (intent.confidence > 0.7) {
      await this.conversationManager.markInteractionSuccess(
        phoneNumber,
        intent.rawText,
        'standard_response', // This would be the actual response
        'positive'
      );
    }
  }

  private getPatternAcknowledgment(persona: UserPersona, intentType: string): string {
    const acknowledgments = {
      streamliner: '⚡ Running your regular check...',
      navigator: '📊 I notice you check this regularly. Running analysis...',
      spring: '🌟 You\'re building great habits! Let me check that for you...',
      hub: '🔄 Running your network-wide check...',
      processor: '[PATTERN_DETECTED] Executing routine query...'
    };
    
    return acknowledgments[persona] || 'Processing your request...';
  }
}