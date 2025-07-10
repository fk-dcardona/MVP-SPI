# WhatsApp Agent Integration Architecture

## Overview

This document outlines the complete integration architecture for connecting WhatsApp messaging with the background agent system, including natural language processing, async execution, persona-based responses, and Twilio webhook handling.

## Architecture Components

### 1. WhatsApp Message Flow

```mermaid
graph TD
    A[WhatsApp User] -->|Sends Message| B[Twilio WhatsApp API]
    B -->|Webhook POST| C[/api/webhooks/whatsapp Route]
    C -->|Parse Message| D[Message Parser]
    D -->|Extract Intent| E[NLP Intent Processor]
    E -->|Map to Agent| F[Agent Mapper]
    F -->|Queue Execution| G[Agent Execution Queue]
    G -->|Execute Agent| H[Agent Manager]
    H -->|Store Results| I[Supabase DB]
    I -->|Generate Response| J[Response Builder]
    J -->|Persona Adaptation| K[Persona Service]
    K -->|Send via WhatsApp| L[WhatsApp Service]
    L -->|Deliver Message| A
```

### 2. Core Components

#### 2.1 Twilio Webhook Handler (`/api/webhooks/whatsapp/route.ts`)

```typescript
interface TwilioWebhookPayload {
  From: string;           // WhatsApp number (e.g., "whatsapp:+1234567890")
  To: string;             // Your Twilio WhatsApp number
  Body: string;           // Message text
  MessageSid: string;     // Unique message ID
  AccountSid: string;     // Twilio account ID
  NumMedia?: string;      // Number of media attachments
  MediaUrl0?: string;     // First media URL (if any)
  ProfileName?: string;   // WhatsApp profile name
}

interface WebhookResponse {
  success: boolean;
  executionId?: string;
  message?: string;
  error?: string;
}
```

#### 2.2 Natural Language Intent Processor

```typescript
interface Intent {
  type: IntentType;
  confidence: number;
  entities: Record<string, any>;
  rawText: string;
}

enum IntentType {
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
```

#### 2.3 Agent Mapping Configuration

```typescript
interface AgentMapping {
  intent: IntentType;
  agentType: AgentType;
  requiredEntities: string[];
  defaultConfig?: Record<string, any>;
  responseTemplate: string;
}

const AGENT_MAPPINGS: AgentMapping[] = [
  {
    intent: IntentType.CHECK_INVENTORY,
    agentType: 'inventory_monitor',
    requiredEntities: ['sku', 'product_name'],
    responseTemplate: 'inventory_check_result'
  },
  {
    intent: IntentType.VIEW_ALERTS,
    agentType: 'alert_generator',
    requiredEntities: ['severity', 'category'],
    defaultConfig: { priority: 'high' },
    responseTemplate: 'alert_summary'
  },
  {
    intent: IntentType.GENERATE_REPORT,
    agentType: 'report_generator',
    requiredEntities: ['report_type', 'date_range'],
    responseTemplate: 'report_ready'
  },
  // ... more mappings
];
```

### 3. Implementation Flow

#### 3.1 Webhook Endpoint (`/api/webhooks/whatsapp/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { validateTwilioRequest } from '@/lib/auth/twilio';
import { WhatsAppMessageProcessor } from '@/lib/whatsapp/message-processor';
import { AgentOrchestrator } from '@/lib/agents/orchestrator';
import { PersonaService } from '@/services/persona-service';
import { WhatsAppService } from '@/lib/notifications/whatsapp-service';

export async function POST(request: NextRequest) {
  try {
    // Validate Twilio webhook signature
    const isValid = await validateTwilioRequest(request);
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse webhook payload
    const payload = await request.formData();
    const message = {
      from: payload.get('From') as string,
      to: payload.get('To') as string,
      body: payload.get('Body') as string,
      messageSid: payload.get('MessageSid') as string,
      profileName: payload.get('ProfileName') as string,
    };

    // Process message asynchronously
    const processor = new WhatsAppMessageProcessor();
    const executionId = await processor.processMessage(message);

    // Send immediate acknowledgment
    const whatsappService = new WhatsAppService();
    await whatsappService.sendMessage({
      to: message.from.replace('whatsapp:', ''),
      body: '✅ Message received. Processing your request...'
    });

    return NextResponse.json({ 
      success: true, 
      executionId,
      message: 'Processing request' 
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

#### 3.2 Message Processor (`/lib/whatsapp/message-processor.ts`)

```typescript
export class WhatsAppMessageProcessor {
  private nlpProcessor: NLPProcessor;
  private agentOrchestrator: AgentOrchestrator;
  private personaService: PersonaService;
  private whatsappService: WhatsAppService;

  async processMessage(message: WhatsAppMessage): Promise<string> {
    const executionId = generateExecutionId();

    // Process in background
    this.processAsync(message, executionId).catch(error => {
      console.error('Async processing error:', error);
      this.sendErrorResponse(message.from, executionId);
    });

    return executionId;
  }

  private async processAsync(message: WhatsAppMessage, executionId: string) {
    // 1. Extract user context
    const user = await this.getUserFromPhone(message.from);
    const persona = await this.personaService.getPersona(user.id);

    // 2. Parse intent and entities
    const intent = await this.nlpProcessor.extractIntent(message.body);
    
    // 3. Map to appropriate agent
    const agentMapping = this.findAgentMapping(intent);
    if (!agentMapping) {
      await this.sendUnknownCommandResponse(message.from, persona);
      return;
    }

    // 4. Validate required entities
    const missingEntities = this.validateEntities(intent, agentMapping);
    if (missingEntities.length > 0) {
      await this.sendClarificationRequest(message.from, missingEntities, persona);
      return;
    }

    // 5. Execute agent
    const result = await this.agentOrchestrator.executeAgent({
      type: agentMapping.agentType,
      userId: user.id,
      companyId: user.company_id,
      context: {
        intent,
        source: 'whatsapp',
        executionId,
        persona
      },
      config: {
        ...agentMapping.defaultConfig,
        ...intent.entities
      }
    });

    // 6. Send persona-adapted response
    await this.sendAgentResponse(message.from, result, persona, agentMapping);
  }

  private async sendAgentResponse(
    to: string, 
    result: AgentExecutionResult,
    persona: UserPersona,
    mapping: AgentMapping
  ) {
    const response = this.buildPersonaResponse(result, persona, mapping);
    
    await this.whatsappService.sendMessage({
      to: to.replace('whatsapp:', ''),
      body: response.body,
      mediaUrl: response.mediaUrl
    });
  }

  private buildPersonaResponse(
    result: AgentExecutionResult,
    persona: UserPersona,
    mapping: AgentMapping
  ): WhatsAppResponse {
    const template = this.getResponseTemplate(mapping.responseTemplate);
    
    switch (persona) {
      case 'streamliner':
        return this.buildStreamlinerResponse(template, result);
      case 'navigator':
        return this.buildNavigatorResponse(template, result);
      case 'hub':
        return this.buildHubResponse(template, result);
      case 'spring':
        return this.buildSpringResponse(template, result);
      case 'processor':
        return this.buildProcessorResponse(template, result);
      default:
        return this.buildDefaultResponse(template, result);
    }
  }
}
```

#### 3.3 Agent Orchestrator (`/lib/agents/orchestrator.ts`)

```typescript
export class AgentOrchestrator {
  private agentManager: AgentManager;
  private queueService: QueueService;
  
  async executeAgent(params: AgentExecutionParams): Promise<AgentExecutionResult> {
    // Create or find agent instance
    const agent = await this.findOrCreateAgent(params);
    
    // Queue for execution
    const execution = await this.queueService.enqueue({
      agentId: agent.id,
      priority: this.calculatePriority(params),
      context: params.context,
      callback: async (result) => {
        await this.handleExecutionComplete(params, result);
      }
    });

    // Execute via AgentManager
    return await this.agentManager.executeAgent(agent.id, params.context);
  }

  private calculatePriority(params: AgentExecutionParams): number {
    // Higher priority for:
    // - Streamliner personas (speed-focused)
    // - Critical alerts
    // - Real-time inventory checks
    if (params.context.persona === 'streamliner') return 10;
    if (params.type === 'alert_generator') return 9;
    if (params.type === 'inventory_monitor') return 8;
    return 5;
  }
}
```

### 4. Natural Language Processing

#### 4.1 Intent Recognition Patterns

```typescript
const INTENT_PATTERNS = {
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
  ]
};
```

#### 4.2 Entity Extraction

```typescript
class EntityExtractor {
  extractEntities(text: string, intentType: IntentType): Record<string, any> {
    const entities: Record<string, any> = {};
    
    switch (intentType) {
      case IntentType.CHECK_INVENTORY:
        entities.product = this.extractProduct(text);
        entities.sku = this.extractSKU(text);
        break;
        
      case IntentType.GENERATE_REPORT:
        entities.report_type = this.extractReportType(text);
        entities.date_range = this.extractDateRange(text);
        break;
        
      case IntentType.VIEW_ALERTS:
        entities.severity = this.extractSeverity(text);
        entities.category = this.extractAlertCategory(text);
        break;
    }
    
    return entities;
  }

  private extractProduct(text: string): string | null {
    // Match product names or SKUs
    const productMatch = text.match(/(?:for|of|level) ([A-Za-z0-9\s-]+)(?:\s|$)/i);
    return productMatch ? productMatch[1].trim() : null;
  }

  private extractDateRange(text: string): { start: Date; end: Date } {
    const today = new Date();
    const ranges: Record<string, () => { start: Date; end: Date }> = {
      'today': () => ({ 
        start: startOfDay(today), 
        end: endOfDay(today) 
      }),
      'yesterday': () => {
        const yesterday = subDays(today, 1);
        return { 
          start: startOfDay(yesterday), 
          end: endOfDay(yesterday) 
        };
      },
      'this week': () => ({ 
        start: startOfWeek(today), 
        end: endOfWeek(today) 
      }),
      'last week': () => {
        const lastWeek = subWeeks(today, 1);
        return { 
          start: startOfWeek(lastWeek), 
          end: endOfWeek(lastWeek) 
        };
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
}
```

### 5. Persona-Adapted Responses

#### 5.1 Response Templates by Persona

```typescript
const PERSONA_RESPONSES = {
  streamliner: {
    inventory_check_result: (data: any) => 
      `📦 ${data.sku}: ${data.quantity} units\n` +
      `📍 Location: ${data.location}\n` +
      `${data.quantity < data.reorder_point ? '⚠️ Below reorder point!' : '✅ Stock OK'}`,
    
    alert_summary: (data: any) =>
      `🚨 ${data.count} active alerts\n` +
      `Critical: ${data.critical || 0} | High: ${data.high || 0}\n` +
      `Reply # to view details`,
    
    report_ready: (data: any) =>
      `✅ Report ready!\n` +
      `📊 View: ${data.link}\n` +
      `📧 Sent to: ${data.email}`
  },

  navigator: {
    inventory_check_result: (data: any) => 
      `📊 **Inventory Analysis - ${data.sku}**\n\n` +
      `Current Stock: ${data.quantity} units\n` +
      `Reorder Point: ${data.reorder_point}\n` +
      `Lead Time: ${data.lead_time} days\n` +
      `Last Reorder: ${data.last_reorder}\n\n` +
      `**Recommendations:**\n` +
      `${data.recommendations.join('\n')}`,
    
    alert_summary: (data: any) =>
      `📋 **Alert Dashboard**\n\n` +
      `Total Active: ${data.count}\n` +
      `By Severity:\n` +
      `  🔴 Critical: ${data.critical || 0}\n` +
      `  🟠 High: ${data.high || 0}\n` +
      `  🟡 Medium: ${data.medium || 0}\n` +
      `  🟢 Low: ${data.low || 0}\n\n` +
      `Reply with alert ID for details`,
    
    report_ready: (data: any) =>
      `📊 **${data.report_type} Report Generated**\n\n` +
      `Period: ${data.date_range}\n` +
      `Format: ${data.format}\n` +
      `Size: ${data.size}\n\n` +
      `Access: ${data.link}\n` +
      `Email sent to: ${data.email}\n\n` +
      `Additional actions:\n` +
      `• SHARE to send to team\n` +
      `• SCHEDULE for recurring reports`
  },

  hub: {
    inventory_check_result: (data: any) => 
      `🏢 **Multi-Entity Inventory Status**\n\n` +
      `Product: ${data.sku}\n\n` +
      data.entities.map(e => 
        `${e.name}: ${e.quantity} units ${e.quantity < e.reorder_point ? '⚠️' : '✅'}`
      ).join('\n') +
      `\n\nTotal Network: ${data.total_quantity} units\n` +
      `Network Coverage: ${data.coverage_days} days`,
    
    // ... more hub templates
  },

  spring: {
    inventory_check_result: (data: any) => 
      `📚 **Learning Moment: Inventory Check**\n\n` +
      `You checked: ${data.sku}\n` +
      `Result: ${data.quantity} units available\n\n` +
      `💡 **Did you know?**\n` +
      `Your reorder point (${data.reorder_point}) is calculated based on:\n` +
      `• Average daily usage\n` +
      `• Lead time from supplier\n` +
      `• Safety stock buffer\n\n` +
      `Want to learn more? Reply LEARN`,
    
    // ... more spring templates
  },

  processor: {
    inventory_check_result: (data: any) => 
      `[INVENTORY_QUERY_RESULT]\n` +
      `Timestamp: ${data.timestamp}\n` +
      `SKU: ${data.sku}\n` +
      `Quantity: ${data.quantity}\n` +
      `Location: ${data.location}\n` +
      `Last_Updated: ${data.last_updated}\n` +
      `Reorder_Status: ${data.quantity < data.reorder_point ? 'REQUIRED' : 'OK'}\n` +
      `Query_Time: ${data.query_time_ms}ms`,
    
    // ... more processor templates
  }
};
```

### 6. Async Response Queue

#### 6.1 Queue Service Implementation

```typescript
interface QueuedExecution {
  id: string;
  agentId: string;
  priority: number;
  context: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: any;
  error?: string;
  callback?: (result: any) => Promise<void>;
}

export class QueueService {
  private queue: PriorityQueue<QueuedExecution>;
  private processing: Map<string, QueuedExecution>;
  private workers: number = 5; // Concurrent workers

  async enqueue(execution: Partial<QueuedExecution>): Promise<QueuedExecution> {
    const queuedExecution: QueuedExecution = {
      id: generateId(),
      status: 'pending',
      createdAt: new Date(),
      priority: 5,
      ...execution
    };

    // Store in database
    await this.storeExecution(queuedExecution);

    // Add to in-memory queue
    this.queue.enqueue(queuedExecution, queuedExecution.priority);

    // Process queue
    this.processQueue();

    return queuedExecution;
  }

  private async processQueue() {
    while (this.processing.size < this.workers && !this.queue.isEmpty()) {
      const execution = this.queue.dequeue();
      if (!execution) break;

      this.processing.set(execution.id, execution);
      
      // Process in background
      this.processExecution(execution).catch(error => {
        console.error(`Queue processing error for ${execution.id}:`, error);
      });
    }
  }

  private async processExecution(execution: QueuedExecution) {
    try {
      // Update status
      execution.status = 'processing';
      execution.startedAt = new Date();
      await this.updateExecution(execution);

      // Execute agent
      const agentManager = AgentManager.getInstance();
      const result = await agentManager.executeAgent(
        execution.agentId, 
        execution.context
      );

      // Update completion
      execution.status = 'completed';
      execution.completedAt = new Date();
      execution.result = result;
      await this.updateExecution(execution);

      // Call callback if provided
      if (execution.callback) {
        await execution.callback(result);
      }

    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      await this.updateExecution(execution);

    } finally {
      this.processing.delete(execution.id);
      this.processQueue(); // Process next in queue
    }
  }
}
```

### 7. Error Handling and Fallbacks

#### 7.1 Error Response Templates

```typescript
const ERROR_RESPONSES = {
  unknown_command: {
    default: `I didn't understand that command. Try:\n` +
      `• "check inventory [product]"\n` +
      `• "view alerts"\n` +
      `• "generate report"\n` +
      `• "help" for all commands`,
    
    streamliner: `❓ Unknown command\n\nQuick commands:\n` +
      `📦 stock [sku]\n🚨 alerts\n📊 report`,
    
    spring: `🤔 I'm not sure what you meant!\n\n` +
      `Here are some things you can try:\n` +
      `• Check inventory: "stock ABC123"\n` +
      `• View alerts: "show alerts"\n` +
      `• Get help: "help"\n\n` +
      `💡 Tip: I understand natural language, so just tell me what you need!`
  },

  missing_entity: {
    product: `Which product would you like to check? Please provide the SKU or product name.`,
    date_range: `What time period? Try "today", "yesterday", "this week", or "last week".`,
    report_type: `What type of report? Options: inventory, sales, supplier, financial`
  },

  agent_error: {
    default: `⚠️ Sorry, there was an error processing your request. Please try again or contact support.`,
    timeout: `⏱️ The request is taking longer than expected. You'll receive a notification when complete.`,
    permission: `🔒 You don't have permission to perform this action.`
  }
};
```

### 8. Database Schema Extensions

```sql
-- WhatsApp conversation tracking
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  message_sid TEXT UNIQUE,
  message_body TEXT,
  intent_type TEXT,
  intent_confidence NUMERIC,
  entities JSONB,
  execution_id UUID,
  response_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent execution queue
CREATE TABLE agent_execution_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  priority INTEGER DEFAULT 5,
  context JSONB,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result JSONB,
  error TEXT
);

-- WhatsApp templates for notifications
CREATE TABLE whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT UNIQUE NOT NULL,
  template_sid TEXT, -- Twilio template SID
  persona TEXT,
  intent_type TEXT,
  template_body TEXT,
  variables JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_phone ON whatsapp_conversations(phone_number);
CREATE INDEX idx_conversations_user ON whatsapp_conversations(user_id);
CREATE INDEX idx_queue_status_priority ON agent_execution_queue(status, priority DESC);
```

### 9. Security Considerations

#### 9.1 Twilio Webhook Validation

```typescript
import crypto from 'crypto';

export async function validateTwilioRequest(request: NextRequest): Promise<boolean> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get('X-Twilio-Signature');
  
  if (!authToken || !signature) {
    return false;
  }

  const url = request.url;
  const params = await request.formData();
  
  // Sort parameters
  const sortedParams = Array.from(params.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}${value}`)
    .join('');

  // Calculate expected signature
  const data = url + sortedParams;
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(data)
    .digest('base64');

  return signature === expectedSignature;
}
```

#### 9.2 Rate Limiting

```typescript
const rateLimiter = new Map<string, { count: number; resetAt: Date }>();

export function checkRateLimit(phoneNumber: string): boolean {
  const now = new Date();
  const limit = rateLimiter.get(phoneNumber);
  
  if (!limit || limit.resetAt < now) {
    rateLimiter.set(phoneNumber, {
      count: 1,
      resetAt: new Date(now.getTime() + 60000) // 1 minute window
    });
    return true;
  }
  
  if (limit.count >= 10) { // 10 messages per minute
    return false;
  }
  
  limit.count++;
  return true;
}
```

### 10. Monitoring and Analytics

#### 10.1 Metrics to Track

```typescript
interface WhatsAppMetrics {
  // Message metrics
  total_messages_received: number;
  total_messages_sent: number;
  avg_response_time_ms: number;
  
  // Intent metrics
  intent_recognition_accuracy: number;
  unknown_intent_rate: number;
  most_common_intents: Record<string, number>;
  
  // Agent metrics
  agent_execution_success_rate: number;
  avg_agent_execution_time_ms: number;
  agent_failures_by_type: Record<string, number>;
  
  // User metrics
  unique_users: number;
  messages_per_user: number;
  persona_distribution: Record<UserPersona, number>;
}
```

#### 10.2 Logging Strategy

```typescript
export class WhatsAppLogger {
  static logIncomingMessage(message: WhatsAppMessage, intent: Intent) {
    console.log('WhatsApp Message Received', {
      from: message.from,
      messageSid: message.messageSid,
      intentType: intent.type,
      confidence: intent.confidence,
      timestamp: new Date().toISOString()
    });
  }

  static logAgentExecution(agentId: string, result: AgentExecutionResult) {
    console.log('Agent Execution via WhatsApp', {
      agentId,
      success: result.success,
      executionTime: result.executionTime,
      source: 'whatsapp',
      timestamp: new Date().toISOString()
    });
  }

  static logResponseSent(to: string, responseType: string, persona: UserPersona) {
    console.log('WhatsApp Response Sent', {
      to,
      responseType,
      persona,
      timestamp: new Date().toISOString()
    });
  }
}
```

## Implementation Checklist

1. **API Routes**
   - [ ] Create `/api/webhooks/whatsapp/route.ts` for Twilio webhooks
   - [ ] Implement Twilio signature validation
   - [ ] Add rate limiting middleware

2. **Message Processing**
   - [ ] Implement NLP intent processor
   - [ ] Create entity extraction logic
   - [ ] Build agent mapping configuration

3. **Agent Integration**
   - [ ] Extend AgentManager for WhatsApp context
   - [ ] Create AgentOrchestrator for async execution
   - [ ] Implement priority queue system

4. **WhatsApp Service**
   - [ ] Extend existing WhatsAppService for agent responses
   - [ ] Add persona-based response templates
   - [ ] Implement media handling for reports

5. **Database**
   - [ ] Create conversation tracking tables
   - [ ] Add execution queue tables
   - [ ] Set up template storage

6. **Persona Integration**
   - [ ] Create persona-specific response builders
   - [ ] Add persona tracking for WhatsApp users
   - [ ] Implement adaptive response selection

7. **Error Handling**
   - [ ] Add comprehensive error responses
   - [ ] Implement retry mechanisms
   - [ ] Create fallback responses

8. **Monitoring**
   - [ ] Set up metrics collection
   - [ ] Add performance tracking
   - [ ] Create alerting for failures

9. **Testing**
   - [ ] Unit tests for NLP processor
   - [ ] Integration tests for agent execution
   - [ ] End-to-end WhatsApp flow tests

10. **Documentation**
    - [ ] API documentation
    - [ ] User command guide
    - [ ] Troubleshooting guide