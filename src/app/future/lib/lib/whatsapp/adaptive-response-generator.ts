import { UserPersona } from '@/types/persona';
import { ConversationContext } from './conversation-state-manager';
import { createServerClient } from '@/lib/supabase/server';

interface ResponsePattern {
  pattern_id: string;
  persona: UserPersona;
  intent_type: string;
  context_type: string;
  response_template: string;
  success_rate: number;
  usage_count: number;
  variables: string[];
}

interface ResponseContext {
  result: any;
  persona: UserPersona;
  conversationStyle: string[];
  previousInteractions: any[];
  currentMood: 'positive' | 'neutral' | 'urgent' | 'frustrated';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  responseLength: 'brief' | 'detailed' | 'visual';
}

export class AdaptiveResponseGenerator {
  private responsePatterns: Map<string, ResponsePattern> = new Map();
  private readonly LEARNING_THRESHOLD = 0.7;
  
  constructor() {
    this.loadResponsePatterns();
  }

  async generateResponse(
    result: any,
    context: ConversationContext,
    intentType: string
  ): Promise<string> {
    // Analyze conversation context
    const responseContext = this.analyzeContext(result, context);
    
    // Find best matching pattern
    const pattern = await this.findBestPattern(intentType, responseContext);
    
    // Generate response using pattern or default
    let response: string;
    if (pattern && pattern.success_rate > this.LEARNING_THRESHOLD) {
      response = this.applyPattern(pattern, result, responseContext);
    } else {
      response = this.generateDefaultResponse(result, responseContext, intentType);
    }
    
    // Adapt based on communication preferences
    response = this.adaptToCommunicationStyle(response, context);
    
    // Add contextual elements
    response = this.addContextualElements(response, context, responseContext);
    
    return response;
  }

  private analyzeContext(result: any, context: ConversationContext): ResponseContext {
    // Determine current mood based on recent interactions
    const currentMood = this.detectMood(context);
    
    // Get time of day
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : 
                     hour < 17 ? 'afternoon' : 
                     hour < 21 ? 'evening' : 'night';
    
    // Determine preferred response length
    const responseLength = context.long_term_memory.communication_preferences.response_style || 'detailed';
    
    return {
      result,
      persona: context.persona,
      conversationStyle: context.long_term_memory.communication_preferences.language_patterns,
      previousInteractions: context.successful_interactions,
      currentMood,
      timeOfDay,
      responseLength: responseLength as 'brief' | 'detailed' | 'visual'
    };
  }

  private detectMood(context: ConversationContext): 'positive' | 'neutral' | 'urgent' | 'frustrated' {
    const recentMessages = context.context_window.slice(-3);
    
    // Check for urgency indicators
    const urgentPatterns = /urgent|asap|immediately|now|critical/i;
    const hasUrgency = recentMessages.some(m => urgentPatterns.test(m.body));
    if (hasUrgency) return 'urgent';
    
    // Check for frustration indicators
    const frustrationPatterns = /not working|wrong|error|again|still/i;
    const hasFrustration = recentMessages.some(m => frustrationPatterns.test(m.body));
    if (hasFrustration) return 'frustrated';
    
    // Check for positive indicators
    const positivePatterns = /thanks|great|perfect|excellent|good/i;
    const hasPositive = recentMessages.some(m => positivePatterns.test(m.body));
    if (hasPositive) return 'positive';
    
    return 'neutral';
  }

  private async findBestPattern(
    intentType: string,
    context: ResponseContext
  ): Promise<ResponsePattern | null> {
    // First, try to find exact match
    const exactKey = `${context.persona}_${intentType}_${context.currentMood}`;
    if (this.responsePatterns.has(exactKey)) {
      return this.responsePatterns.get(exactKey)!;
    }
    
    // Find patterns for this persona and intent
    const candidates = Array.from(this.responsePatterns.values())
      .filter(p => p.persona === context.persona && p.intent_type === intentType)
      .sort((a, b) => b.success_rate - a.success_rate);
    
    return candidates[0] || null;
  }

  private applyPattern(
    pattern: ResponsePattern,
    result: any,
    context: ResponseContext
  ): string {
    let response = pattern.response_template;
    
    // Replace variables in template
    pattern.variables.forEach(variable => {
      const value = this.extractVariable(variable, result, context);
      response = response.replace(`{{${variable}}}`, value);
    });
    
    return response;
  }

  private extractVariable(variable: string, result: any, context: ResponseContext): string {
    // Handle special variables
    switch (variable) {
      case 'greeting':
        return this.getTimeBasedGreeting(context.timeOfDay);
      case 'emoji':
        return this.getMoodEmoji(context.currentMood);
      case 'sign_off':
        return this.getPersonaSignOff(context.persona);
      default:
        // Extract from result object
        return result[variable] || `[${variable}]`;
    }
  }

  private generateDefaultResponse(
    result: any,
    context: ResponseContext,
    intentType: string
  ): string {
    // Generate response based on persona and intent
    const templates = this.getDefaultTemplates();
    const template = templates[context.persona]?.[intentType] || templates.default[intentType];
    
    if (!template) {
      return JSON.stringify(result, null, 2);
    }
    
    // Apply template function
    return template(result);
  }

  private adaptToCommunicationStyle(response: string, context: ConversationContext): string {
    const preferences = context.long_term_memory.communication_preferences;
    
    // Adapt length
    if (preferences.response_style === 'brief') {
      response = this.makeBrief(response);
    } else if (preferences.response_style === 'visual') {
      response = this.addVisualElements(response);
    }
    
    // Adapt tone
    if (preferences.language_patterns.includes('polite')) {
      response = this.makePolite(response);
    }
    if (preferences.language_patterns.includes('urgent')) {
      response = this.makeUrgent(response);
    }
    
    return response;
  }

  private makeBrief(response: string): string {
    // Remove extra details, keep only essential information
    const lines = response.split('\n').filter(line => line.trim());
    
    // Keep only first 3-4 lines for brief responses
    if (lines.length > 4) {
      return lines.slice(0, 3).join('\n') + '\n📎 Reply MORE for details';
    }
    
    return response;
  }

  private addVisualElements(response: string): string {
    // Add charts, graphs, or visual indicators
    if (response.includes('increase')) {
      response = response.replace(/increase/gi, '📈 increase');
    }
    if (response.includes('decrease')) {
      response = response.replace(/decrease/gi, '📉 decrease');
    }
    if (response.includes('alert') || response.includes('warning')) {
      response = '⚠️ ' + response;
    }
    
    return response;
  }

  private makePolite(response: string): string {
    if (!response.toLowerCase().includes('please') && !response.toLowerCase().includes('thank')) {
      response = 'Thank you for your query. ' + response;
    }
    return response;
  }

  private makeUrgent(response: string): string {
    return '🚨 IMMEDIATE ACTION: ' + response;
  }

  private addContextualElements(
    response: string,
    context: ConversationContext,
    responseContext: ResponseContext
  ): string {
    // Add time-based elements
    if (responseContext.timeOfDay === 'morning' && context.context_window.length === 1) {
      response = this.getTimeBasedGreeting(responseContext.timeOfDay) + '\n\n' + response;
    }
    
    // Add continuity elements
    if (context.working_memory.current_task) {
      response = response + '\n\n📋 Still working on: ' + context.working_memory.current_task;
    }
    
    // Add proactive suggestions based on patterns
    const suggestions = this.getProactiveSuggestions(context);
    if (suggestions.length > 0) {
      response = response + '\n\n💡 ' + suggestions[0];
    }
    
    return response;
  }

  private getProactiveSuggestions(context: ConversationContext): string[] {
    const suggestions: string[] = [];
    
    // Check common queries
    const topQueries = context.long_term_memory.common_queries
      .filter(q => q.frequency > 5)
      .slice(0, 3);
    
    if (topQueries.length > 0) {
      suggestions.push(`Quick tip: You can set up alerts for ${topQueries[0].query}`);
    }
    
    // Check order patterns
    const orderPatterns = context.long_term_memory.typical_order_patterns;
    if (orderPatterns.length > 0) {
      const pattern = orderPatterns[0];
      suggestions.push(`Based on your history, you might need to reorder ${pattern.product} soon`);
    }
    
    return suggestions;
  }

  private getTimeBasedGreeting(timeOfDay: string): string {
    const greetings = {
      morning: '🌅 Good morning!',
      afternoon: '☀️ Good afternoon!',
      evening: '🌆 Good evening!',
      night: '🌙 Working late?'
    };
    return greetings[timeOfDay] || '👋 Hello!';
  }

  private getMoodEmoji(mood: string): string {
    const emojis = {
      positive: '😊',
      neutral: '👍',
      urgent: '🚨',
      frustrated: '🤝'
    };
    return emojis[mood] || '📌';
  }

  private getPersonaSignOff(persona: UserPersona): string {
    const signoffs = {
      streamliner: 'Done! ⚡',
      navigator: 'Analysis complete. 🎯',
      spring: 'Hope this helps! 🌱',
      hub: 'Network update complete. 🌐',
      processor: '[END_TRANSMISSION]'
    };
    return signoffs[persona] || 'Complete. ✅';
  }

  private getDefaultTemplates(): any {
    return {
      streamliner: {
        inventory_check_result: (data: any) => 
          `📦 ${data.sku || data.product}: ${data.quantity || 0}\n` +
          `📍 ${data.location || 'Main'}\n` +
          `${data.status === 'low' ? '⚠️ Reorder!' : '✅ OK'}`,
        
        alert_summary: (data: any) =>
          `🚨 ${data.total || 0} alerts\n` +
          `Critical: ${data.critical || 0}`,
          
        report_ready: (data: any) =>
          `✅ Report: ${data.link || 'Ready'}`
      },
      
      navigator: {
        inventory_check_result: (data: any) => 
          `📊 **Inventory Analysis**\n\n` +
          `Product: ${data.product || data.sku}\n` +
          `Current: ${data.quantity || 0} units\n` +
          `Status: ${data.status}\n\n` +
          `Trend: ${data.trend || 'Stable'}\n` +
          `Recommendation: ${data.recommendation || 'Monitor'}`,
          
        alert_summary: (data: any) =>
          `📋 **Alert Dashboard**\n\n` +
          `Total: ${data.total || 0}\n` +
          `By Priority:\n` +
          `• Critical: ${data.critical || 0}\n` +
          `• High: ${data.high || 0}\n` +
          `• Medium: ${data.medium || 0}`
      },
      
      spring: {
        inventory_check_result: (data: any) => 
          `📚 Let me explain what I found!\n\n` +
          `Product: ${data.product || data.sku}\n` +
          `You have: ${data.quantity || 0} units\n\n` +
          `${data.status === 'low' ? '💡 Tip: Time to reorder! Want me to help?' : '✨ Great! Stock levels look good!'}`
      },
      
      hub: {
        inventory_check_result: (data: any) => 
          `🏢 **Network Inventory**\n\n` +
          `Product: ${data.product || data.sku}\n` +
          `Total across entities: ${data.total_quantity || 0}\n` +
          `Distribution: ${data.entity_count || 1} locations`
      },
      
      processor: {
        inventory_check_result: (data: any) => 
          `[QUERY_RESULT]\n` +
          `SKU: ${data.sku}\n` +
          `QTY: ${data.quantity}\n` +
          `STATUS: ${data.status}\n` +
          `TIMESTAMP: ${new Date().toISOString()}`
      },
      
      default: {
        inventory_check_result: (data: any) => JSON.stringify(data, null, 2)
      }
    };
  }

  async learnFromFeedback(
    phoneNumber: string,
    response: string,
    feedback: 'positive' | 'negative',
    intentType: string,
    persona: UserPersona
  ): Promise<void> {
    // Create or update response pattern based on feedback
    const key = `${persona}_${intentType}_${feedback}`;
    
    if (feedback === 'positive') {
      // Extract pattern from successful response
      const pattern = this.extractPatternFromResponse(response, intentType, persona);
      
      // Store in database
      await this.storeLearnedPattern(pattern);
      
      // Update in-memory patterns
      this.responsePatterns.set(key, pattern);
    } else {
      // Decrease success rate for this pattern
      const existingPattern = this.responsePatterns.get(key);
      if (existingPattern) {
        existingPattern.success_rate *= 0.9; // Decay by 10%
        existingPattern.usage_count++;
      }
    }
  }

  private extractPatternFromResponse(
    response: string,
    intentType: string,
    persona: UserPersona
  ): ResponsePattern {
    // Extract variables from response
    const variables: string[] = [];
    const variablePattern = /\b(\d+|[A-Z]{3,})\b/g;
    let match;
    
    while ((match = variablePattern.exec(response)) !== null) {
      variables.push(match[1]);
    }
    
    // Create template by replacing variables
    let template = response;
    variables.forEach((v, i) => {
      template = template.replace(v, `{{var${i}}}`);
    });
    
    return {
      pattern_id: crypto.randomUUID(),
      persona,
      intent_type: intentType,
      context_type: 'learned',
      response_template: template,
      success_rate: 1.0,
      usage_count: 1,
      variables: variables.map((_, i) => `var${i}`)
    };
  }

  private async storeLearnedPattern(pattern: ResponsePattern): Promise<void> {
    const supabase = createServerClient();
    
    await supabase
      .from('whatsapp_response_patterns')
      .upsert({
        pattern_id: pattern.pattern_id,
        persona: pattern.persona,
        intent_type: pattern.intent_type,
        context_type: pattern.context_type,
        response_template: pattern.response_template,
        success_rate: pattern.success_rate,
        usage_count: pattern.usage_count,
        variables: pattern.variables,
        created_at: new Date().toISOString()
      });
  }

  private async loadResponsePatterns(): Promise<void> {
    const supabase = createServerClient();
    
    const { data: patterns } = await supabase
      .from('whatsapp_response_patterns')
      .select('*')
      .gte('success_rate', this.LEARNING_THRESHOLD);
    
    if (patterns) {
      patterns.forEach(p => {
        const key = `${p.persona}_${p.intent_type}_${p.context_type}`;
        this.responsePatterns.set(key, p as ResponsePattern);
      });
    }
  }
}