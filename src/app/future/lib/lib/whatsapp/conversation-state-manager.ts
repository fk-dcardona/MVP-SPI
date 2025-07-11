import { createServerClient } from '@/lib/supabase/server';
import { PersonaService } from '@/services/persona-service';
import { UserPersona } from '@/types/persona';

export interface Message {
  id: string;
  from: string;
  to: string;
  body: string;
  timestamp: Date;
  intent?: string;
  entities?: Record<string, any>;
  confidence?: number;
}

export interface WorkingMemory {
  current_task: string | null;
  entities_mentioned: Record<string, any>;
  pending_clarifications: string[];
  user_preferences_learned: Record<string, any>;
  last_referenced_items: Array<{
    type: string;
    value: any;
    mentioned_at: Date;
  }>;
}

export interface LongTermMemory {
  common_queries: Array<{
    query: string;
    frequency: number;
    last_asked: Date;
  }>;
  preferred_suppliers: string[];
  typical_order_patterns: Array<{
    product: string;
    quantity: number;
    frequency_days: number;
  }>;
  communication_preferences: {
    response_style: 'brief' | 'detailed' | 'visual';
    preferred_times: string[];
    language_patterns: string[];
  };
}

export interface ConversationContext {
  thread_id: string;
  user_id: string;
  phone_number: string;
  persona: UserPersona;
  started_at: Date;
  last_activity: Date;
  context_window: Message[];
  working_memory: WorkingMemory;
  long_term_memory: LongTermMemory;
  successful_interactions: Array<{
    pattern: string;
    response: string;
    user_satisfaction: 'positive' | 'neutral' | 'negative';
  }>;
}

export class ConversationStateManager {
  private conversations: Map<string, ConversationContext> = new Map();
  private readonly CONTEXT_WINDOW_SIZE = 10;
  private readonly MEMORY_PERSIST_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private personaService: PersonaService;

  constructor() {
    this.personaService = PersonaService.getInstance();
    this.startMemoryPersistence();
  }

  async getOrCreateContext(phoneNumber: string, userId?: string): Promise<ConversationContext> {
    // Check in-memory cache first
    let context = this.conversations.get(phoneNumber);
    
    if (!context) {
      // Try to load from database
      context = await this.loadContextFromDatabase(phoneNumber);
      
      if (!context) {
        // Create new context
        context = await this.createNewContext(phoneNumber, userId);
      }
      
      this.conversations.set(phoneNumber, context);
    }
    
    // Update last activity
    context.last_activity = new Date();
    
    return context;
  }

  async addMessageToContext(
    phoneNumber: string, 
    message: Message, 
    intent?: string, 
    entities?: Record<string, any>
  ): Promise<ConversationContext> {
    const context = await this.getOrCreateContext(phoneNumber);
    
    // Enrich message with intent data
    message.intent = intent;
    message.entities = entities;
    
    // Add to context window
    context.context_window.push(message);
    
    // Maintain window size
    if (context.context_window.length > this.CONTEXT_WINDOW_SIZE) {
      context.context_window.shift();
    }
    
    // Update working memory
    this.updateWorkingMemory(context, message, intent, entities);
    
    // Learn from the conversation
    await this.extractLearnings(context, message);
    
    return context;
  }

  async continueConversation(
    phoneNumber: string,
    currentMessage: string
  ): Promise<{
    context: ConversationContext;
    enrichedIntent: any;
    requiresClarification: boolean;
  }> {
    const context = await this.getOrCreateContext(phoneNumber);
    
    // Check if this is a clarification response
    if (context.working_memory.pending_clarifications.length > 0) {
      return {
        context,
        enrichedIntent: {
          type: 'clarification',
          original_question: context.working_memory.pending_clarifications[0],
          response: currentMessage
        },
        requiresClarification: false
      };
    }
    
    // Check for contextual references
    const enrichedIntent = this.enrichIntentWithContext(currentMessage, context);
    
    // Determine if clarification is needed
    const requiresClarification = this.needsClarification(enrichedIntent, context);
    
    return {
      context,
      enrichedIntent,
      requiresClarification
    };
  }

  private updateWorkingMemory(
    context: ConversationContext,
    message: Message,
    intent?: string,
    entities?: Record<string, any>
  ): void {
    // Update current task
    if (intent && ['check_inventory', 'generate_report', 'reorder_stock'].includes(intent)) {
      context.working_memory.current_task = intent;
    }
    
    // Merge entities
    if (entities) {
      context.working_memory.entities_mentioned = {
        ...context.working_memory.entities_mentioned,
        ...entities
      };
      
      // Track recently referenced items
      Object.entries(entities).forEach(([type, value]) => {
        context.working_memory.last_referenced_items.unshift({
          type,
          value,
          mentioned_at: new Date()
        });
      });
      
      // Keep only recent references
      context.working_memory.last_referenced_items = 
        context.working_memory.last_referenced_items.slice(0, 5);
    }
  }

  private enrichIntentWithContext(message: string, context: ConversationContext): any {
    const enriched: any = {
      raw_message: message,
      contextual_entities: {}
    };
    
    // Handle pronouns and references
    const pronounPatterns = [
      { pattern: /\b(it|that|this)\b/i, type: 'reference' },
      { pattern: /\b(same|similar|like)\b/i, type: 'comparison' },
      { pattern: /\b(again|more|another)\b/i, type: 'repetition' },
      { pattern: /\b(yesterday|today|tomorrow|last\s+week)\b/i, type: 'temporal' }
    ];
    
    pronounPatterns.forEach(({ pattern, type }) => {
      if (pattern.test(message)) {
        enriched[`has_${type}`] = true;
        
        // Try to resolve references
        if (type === 'reference' && context.working_memory.last_referenced_items.length > 0) {
          const lastItem = context.working_memory.last_referenced_items[0];
          enriched.contextual_entities[lastItem.type] = lastItem.value;
        }
      }
    });
    
    // Handle "same as" patterns
    if (/same as/.test(message.toLowerCase())) {
      const lastQuery = context.context_window
        .filter(m => m.intent)
        .slice(-2)[0]; // Get second to last message with intent
      
      if (lastQuery) {
        enriched.reference_intent = lastQuery.intent;
        enriched.reference_entities = lastQuery.entities;
      }
    }
    
    return enriched;
  }

  private needsClarification(enrichedIntent: any, context: ConversationContext): boolean {
    // Check if we have unresolved references
    if (enrichedIntent.has_reference && !enrichedIntent.contextual_entities) {
      return true;
    }
    
    // Check if temporal reference needs date resolution
    if (enrichedIntent.has_temporal && !enrichedIntent.resolved_date) {
      return true;
    }
    
    // Check if comparison lacks base reference
    if (enrichedIntent.has_comparison && !enrichedIntent.reference_entities) {
      return true;
    }
    
    return false;
  }

  private async extractLearnings(context: ConversationContext, message: Message): Promise<void> {
    // Learn communication preferences
    this.learnCommunicationStyle(context, message);
    
    // Extract commonly asked queries
    this.updateCommonQueries(context, message);
    
    // Learn entity preferences
    this.learnEntityPreferences(context, message);
  }

  private learnCommunicationStyle(context: ConversationContext, message: Message): void {
    const messageLength = message.body.length;
    const hasQuestionMark = message.body.includes('?');
    const isCommand = message.body.length < 20 && !hasQuestionMark;
    
    // Infer preference for brief vs detailed responses
    if (isCommand) {
      context.long_term_memory.communication_preferences.response_style = 'brief';
    } else if (messageLength > 50) {
      context.long_term_memory.communication_preferences.response_style = 'detailed';
    }
    
    // Track language patterns
    const patterns = [
      { pattern: /please|thank you|thanks/i, style: 'polite' },
      { pattern: /asap|urgent|now/i, style: 'urgent' },
      { pattern: /\?.*\?/i, style: 'inquisitive' }
    ];
    
    patterns.forEach(({ pattern, style }) => {
      if (pattern.test(message.body)) {
        if (!context.long_term_memory.communication_preferences.language_patterns.includes(style)) {
          context.long_term_memory.communication_preferences.language_patterns.push(style);
        }
      }
    });
  }

  private updateCommonQueries(context: ConversationContext, message: Message): void {
    if (!message.intent) return;
    
    const existingQuery = context.long_term_memory.common_queries
      .find(q => q.query === message.intent);
    
    if (existingQuery) {
      existingQuery.frequency++;
      existingQuery.last_asked = new Date();
    } else {
      context.long_term_memory.common_queries.push({
        query: message.intent,
        frequency: 1,
        last_asked: new Date()
      });
    }
    
    // Sort by frequency
    context.long_term_memory.common_queries.sort((a, b) => b.frequency - a.frequency);
  }

  private learnEntityPreferences(context: ConversationContext, message: Message): void {
    if (!message.entities) return;
    
    // Track supplier preferences
    if (message.entities.supplier_name) {
      const supplier = message.entities.supplier_name;
      if (!context.long_term_memory.preferred_suppliers.includes(supplier)) {
        context.long_term_memory.preferred_suppliers.push(supplier);
      }
    }
    
    // Track order patterns
    if (message.intent === 'reorder_stock' && message.entities.product && message.entities.quantity) {
      const pattern = context.long_term_memory.typical_order_patterns
        .find(p => p.product === message.entities!.product);
      
      if (pattern) {
        // Update average quantity
        pattern.quantity = Math.round((pattern.quantity + message.entities.quantity) / 2);
      } else {
        context.long_term_memory.typical_order_patterns.push({
          product: message.entities.product,
          quantity: message.entities.quantity,
          frequency_days: 30 // Default, will be updated over time
        });
      }
    }
  }

  private async loadContextFromDatabase(phoneNumber: string): Promise<ConversationContext | null> {
    const supabase = createServerClient();
    
    const { data } = await supabase
      .from('whatsapp_conversation_state')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();
    
    if (!data) return null;
    
    return {
      thread_id: data.thread_id,
      user_id: data.user_id,
      phone_number: data.phone_number,
      persona: data.persona as UserPersona,
      started_at: new Date(data.started_at),
      last_activity: new Date(data.last_activity),
      context_window: data.context_window || [],
      working_memory: data.working_memory || this.createEmptyWorkingMemory(),
      long_term_memory: data.long_term_memory || this.createEmptyLongTermMemory(),
      successful_interactions: data.successful_interactions || []
    };
  }

  private async createNewContext(phoneNumber: string, userId?: string): Promise<ConversationContext> {
    const supabase = createServerClient();
    
    // Get user info if not provided
    if (!userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phoneNumber)
        .single();
      
      userId = profile?.id;
    }
    
    // Get persona
    const persona = userId 
      ? await this.personaService.getPersona(userId) 
      : 'streamliner' as UserPersona;
    
    const context: ConversationContext = {
      thread_id: crypto.randomUUID(),
      user_id: userId || '',
      phone_number: phoneNumber,
      persona,
      started_at: new Date(),
      last_activity: new Date(),
      context_window: [],
      working_memory: this.createEmptyWorkingMemory(),
      long_term_memory: this.createEmptyLongTermMemory(),
      successful_interactions: []
    };
    
    // Save to database
    await this.saveContextToDatabase(context);
    
    return context;
  }

  private createEmptyWorkingMemory(): WorkingMemory {
    return {
      current_task: null,
      entities_mentioned: {},
      pending_clarifications: [],
      user_preferences_learned: {},
      last_referenced_items: []
    };
  }

  private createEmptyLongTermMemory(): LongTermMemory {
    return {
      common_queries: [],
      preferred_suppliers: [],
      typical_order_patterns: [],
      communication_preferences: {
        response_style: 'detailed',
        preferred_times: [],
        language_patterns: []
      }
    };
  }

  private async saveContextToDatabase(context: ConversationContext): Promise<void> {
    const supabase = createServerClient();
    
    await supabase
      .from('whatsapp_conversation_state')
      .upsert({
        thread_id: context.thread_id,
        phone_number: context.phone_number,
        user_id: context.user_id,
        persona: context.persona,
        started_at: context.started_at.toISOString(),
        last_activity: context.last_activity.toISOString(),
        context_window: context.context_window,
        working_memory: context.working_memory,
        long_term_memory: context.long_term_memory,
        successful_interactions: context.successful_interactions
      });
  }

  private startMemoryPersistence(): void {
    setInterval(() => {
      this.persistAllContexts();
    }, this.MEMORY_PERSIST_INTERVAL);
  }

  private async persistAllContexts(): Promise<void> {
    const promises = Array.from(this.conversations.values())
      .map(context => this.saveContextToDatabase(context));
    
    await Promise.all(promises);
  }

  // Public methods for feedback and learning
  async markInteractionSuccess(
    phoneNumber: string,
    pattern: string,
    response: string,
    satisfaction: 'positive' | 'neutral' | 'negative'
  ): Promise<void> {
    const context = await this.getOrCreateContext(phoneNumber);
    
    context.successful_interactions.push({
      pattern,
      response,
      user_satisfaction: satisfaction
    });
    
    // Keep only recent successful interactions
    if (context.successful_interactions.length > 20) {
      context.successful_interactions = context.successful_interactions.slice(-20);
    }
  }

  async addClarificationNeeded(phoneNumber: string, clarification: string): Promise<void> {
    const context = await this.getOrCreateContext(phoneNumber);
    context.working_memory.pending_clarifications.push(clarification);
  }

  async resolveClarification(phoneNumber: string): Promise<void> {
    const context = await this.getOrCreateContext(phoneNumber);
    context.working_memory.pending_clarifications.shift();
  }

  getActiveConversations(): string[] {
    return Array.from(this.conversations.keys());
  }

  async clearInactiveConversations(inactiveMinutes: number = 30): Promise<void> {
    const now = new Date();
    const toRemove: string[] = [];
    
    for (const [phoneNumber, context] of this.conversations.entries()) {
      const inactiveTime = now.getTime() - context.last_activity.getTime();
      if (inactiveTime > inactiveMinutes * 60 * 1000) {
        await this.saveContextToDatabase(context);
        toRemove.push(phoneNumber);
      }
    }
    
    toRemove.forEach(phoneNumber => this.conversations.delete(phoneNumber));
  }
}