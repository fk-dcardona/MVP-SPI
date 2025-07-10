import { createServerClient } from '@/lib/supabase/server';
import { WhatsAppService } from '@/lib/notifications/whatsapp-service';
import { ConversationStateManager } from './conversation-state-manager';
import { UserPersona } from '@/types/persona';

export interface ProactiveInsight {
  id: string;
  type: 'pattern' | 'opportunity' | 'risk' | 'optimization' | 'learning';
  priority: 'critical' | 'high' | 'medium' | 'low';
  confidence: number;
  title: string;
  message: string;
  data: Record<string, any>;
  suggested_actions: InsightAction[];
  triggered_by: string;
  user_id: string;
  phone_number: string;
  persona: UserPersona;
  expires_at?: Date;
}

export interface InsightAction {
  type: 'message' | 'agent_execution' | 'notification' | 'reminder';
  description: string;
  command?: string;
  delay_minutes?: number;
}

export class ProactiveInsightEngine {
  private whatsappService: WhatsAppService;
  private conversationManager: ConversationStateManager;
  private readonly INSIGHT_INTERVAL = 30 * 60 * 1000; // 30 minutes
  private readonly MIN_CONFIDENCE = 0.6;
  
  constructor() {
    this.whatsappService = new WhatsAppService();
    this.conversationManager = new ConversationStateManager();
    this.startInsightGeneration();
  }

  async generateInsightsForUser(userId: string): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    
    try {
      // Get user's conversation context
      const supabase = createServerClient();
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone, company_id')
        .eq('id', userId)
        .single();
      
      if (!profile?.phone) return insights;
      
      const context = await this.conversationManager.getOrCreateContext(profile.phone, userId);
      
      // Generate different types of insights
      const patternInsights = await this.detectPatternInsights(context, userId);
      const opportunityInsights = await this.findOpportunityInsights(context, userId);
      const riskInsights = await this.assessRiskInsights(context, userId);
      const learningInsights = await this.generateLearningInsights(context, userId);
      const optimizationInsights = await this.findOptimizationInsights(context, userId);
      
      insights.push(
        ...patternInsights,
        ...opportunityInsights,
        ...riskInsights,
        ...learningInsights,
        ...optimizationInsights
      );
      
      // Filter by confidence and deduplicate
      return insights
        .filter(insight => insight.confidence >= this.MIN_CONFIDENCE)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5); // Limit to top 5 insights
        
    } catch (error) {
      console.error('Error generating insights for user:', error);
      return insights;
    }
  }

  private async detectPatternInsights(context: any, userId: string): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    
    // Analyze query patterns
    const commonQueries = context.long_term_memory.common_queries
      .filter((q: any) => q.frequency >= 5);
    
    for (const query of commonQueries) {
      const timeSinceLastQuery = Date.now() - new Date(query.last_asked).getTime();
      const daysSince = timeSinceLastQuery / (1000 * 60 * 60 * 24);
      
      // Suggest automation for frequent queries
      if (query.frequency >= 10 && daysSince <= 7) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'pattern',
          priority: 'medium',
          confidence: 0.8,
          title: 'Automation Opportunity',
          message: `You've checked ${query.query.replace('_', ' ')} ${query.frequency} times. Would you like me to set up automatic alerts?`,
          data: {
            query_type: query.query,
            frequency: query.frequency,
            suggested_automation: this.getAutomationSuggestion(query.query)
          },
          suggested_actions: [{
            type: 'message',
            description: 'Set up automated alerts',
            command: `setup alert ${query.query}`
          }],
          triggered_by: 'pattern_detection',
          user_id: userId,
          phone_number: context.phone_number,
          persona: context.persona
        });
      }
    }
    
    // Analyze order patterns
    const orderPatterns = context.long_term_memory.typical_order_patterns;
    for (const pattern of orderPatterns) {
      if (pattern.frequency_days > 0) {
        const predictedReorderDate = new Date();
        predictedReorderDate.setDate(predictedReorderDate.getDate() + pattern.frequency_days);
        
        insights.push({
          id: crypto.randomUUID(),
          type: 'pattern',
          priority: 'high',
          confidence: 0.9,
          title: 'Reorder Prediction',
          message: `Based on your pattern, you'll likely need to reorder ${pattern.product} around ${predictedReorderDate.toDateString()}`,
          data: {
            product: pattern.product,
            predicted_date: predictedReorderDate,
            typical_quantity: pattern.quantity,
            confidence_days: pattern.frequency_days
          },
          suggested_actions: [{
            type: 'reminder',
            description: 'Remind me 3 days before',
            delay_minutes: (pattern.frequency_days - 3) * 24 * 60
          }],
          triggered_by: 'order_pattern_analysis',
          user_id: userId,
          phone_number: context.phone_number,
          persona: context.persona
        });
      }
    }
    
    return insights;
  }

  private async findOpportunityInsights(context: any, userId: string): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    const supabase = createServerClient();
    
    // Check for inventory optimization opportunities
    const { data: inventoryItems } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('company_id', context.user_id)
      .order('last_updated', { ascending: false })
      .limit(10);
    
    if (inventoryItems) {
      // Find overstocked items
      const overstocked = inventoryItems.filter(item => 
        item.quantity > (item.reorder_point * 3) && item.turnover_days > 90
      );
      
      if (overstocked.length > 0) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'opportunity',
          priority: 'medium',
          confidence: 0.7,
          title: 'Cash Flow Opportunity',
          message: `You have ${overstocked.length} overstocked items that could free up $${this.calculateOverstockValue(overstocked)} in cash`,
          data: {
            overstocked_items: overstocked.slice(0, 3),
            total_value: this.calculateOverstockValue(overstocked),
            cash_flow_impact: this.calculateOverstockValue(overstocked) * 0.1 // 10% annual cost
          },
          suggested_actions: [{
            type: 'message',
            description: 'Review overstock report',
            command: 'generate overstock report'
          }],
          triggered_by: 'inventory_analysis',
          user_id: userId,
          phone_number: context.phone_number,
          persona: context.persona
        });
      }
      
      // Find fast-moving items that could be optimized
      const fastMoving = inventoryItems.filter(item => 
        item.turnover_days < 30 && item.stockout_events > 2
      );
      
      if (fastMoving.length > 0) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'opportunity',
          priority: 'high',
          confidence: 0.85,
          title: 'Stock Optimization',
          message: `${fastMoving.length} fast-moving items are causing stockouts. Optimizing could increase sales by ${fastMoving.length * 15}%`,
          data: {
            fast_moving_items: fastMoving.slice(0, 3),
            potential_revenue_increase: fastMoving.length * 0.15,
            recommended_safety_stock: fastMoving.map(item => ({
              sku: item.sku,
              current: item.safety_stock,
              recommended: Math.ceil(item.average_daily_usage * 7)
            }))
          },
          suggested_actions: [{
            type: 'agent_execution',
            description: 'Optimize reorder points',
            command: 'run optimization_engine'
          }],
          triggered_by: 'stockout_analysis',
          user_id: userId,
          phone_number: context.phone_number,
          persona: context.persona
        });
      }
    }
    
    return insights;
  }

  private async assessRiskInsights(context: any, userId: string): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    const supabase = createServerClient();
    
    // Check for supplier risk
    const { data: suppliers } = await supabase
      .from('suppliers')
      .select('*')
      .eq('company_id', context.user_id);
    
    if (suppliers) {
      const riskySuppliers = suppliers.filter(supplier => 
        supplier.performance_score < 70 || supplier.delivery_reliability < 80
      );
      
      if (riskySuppliers.length > 0) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'risk',
          priority: 'high',
          confidence: 0.9,
          title: 'Supplier Risk Alert',
          message: `${riskySuppliers.length} suppliers showing declining performance. This could impact ${this.estimateSupplierImpact(riskySuppliers)}% of your orders`,
          data: {
            risky_suppliers: riskySuppliers.map(s => ({
              name: s.name,
              performance_score: s.performance_score,
              issues: s.recent_issues || []
            })),
            impact_percentage: this.estimateSupplierImpact(riskySuppliers),
            recommended_actions: ['Diversify suppliers', 'Increase safety stock', 'Alternative sourcing']
          },
          suggested_actions: [{
            type: 'agent_execution',
            description: 'Generate supplier risk report',
            command: 'generate supplier risk report'
          }],
          triggered_by: 'supplier_analysis',
          user_id: userId,
          phone_number: context.phone_number,
          persona: context.persona
        });
      }
    }
    
    // Check for cash flow risk
    const { data: cashFlow } = await supabase
      .from('financial_metrics')
      .select('*')
      .eq('company_id', context.user_id)
      .order('date', { ascending: false })
      .limit(30);
    
    if (cashFlow && cashFlow.length >= 7) {
      const recentCashFlow = cashFlow.slice(0, 7);
      const averageCash = recentCashFlow.reduce((sum, day) => sum + day.cash_position, 0) / 7;
      const trend = this.calculateTrend(recentCashFlow.map(d => d.cash_position));
      
      if (trend < -0.1 && averageCash < 50000) { // Declining trend and low cash
        insights.push({
          id: crypto.randomUUID(),
          type: 'risk',
          priority: 'critical',
          confidence: 0.95,
          title: 'Cash Flow Risk',
          message: `Cash flow declining ${Math.abs(trend * 100).toFixed(1)}% weekly. Current runway: ${this.calculateRunway(averageCash, trend)} days`,
          data: {
            current_cash: averageCash,
            weekly_trend: trend,
            runway_days: this.calculateRunway(averageCash, trend),
            recommended_actions: ['Accelerate collections', 'Delay non-critical payments', 'Review credit terms']
          },
          suggested_actions: [{
            type: 'message',
            description: 'Generate cash flow forecast',
            command: 'generate cash flow forecast'
          }],
          triggered_by: 'cash_flow_analysis',
          user_id: userId,
          phone_number: context.phone_number,
          persona: context.persona,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24 hours
        });
      }
    }
    
    return insights;
  }

  private async generateLearningInsights(context: any, userId: string): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    
    // Insights based on persona
    if (context.persona === 'spring') {
      // Learning opportunities for Spring personas
      const unusedFeatures = this.identifyUnusedFeatures(context);
      
      if (unusedFeatures.length > 0) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'learning',
          priority: 'low',
          confidence: 0.7,
          title: 'New Feature to Explore',
          message: `There are ${unusedFeatures.length} features that could help you! Want to learn about ${unusedFeatures[0]}?`,
          data: {
            unused_features: unusedFeatures,
            suggested_feature: unusedFeatures[0],
            learning_benefit: this.getFeatureBenefit(unusedFeatures[0])
          },
          suggested_actions: [{
            type: 'message',
            description: 'Start tutorial',
            command: `learn ${unusedFeatures[0]}`
          }],
          triggered_by: 'learning_analysis',
          user_id: userId,
          phone_number: context.phone_number,
          persona: context.persona
        });
      }
    }
    
    // Suggest advanced features for experienced users
    if (context.context_window.length > 50 && context.persona !== 'spring') {
      insights.push({
        id: crypto.randomUUID(),
        type: 'learning',
        priority: 'low',
        confidence: 0.6,
        title: 'Power User Tip',
        message: 'You can create custom shortcuts for your most common queries. Want to set one up?',
        data: {
          most_common_query: context.long_term_memory.common_queries[0]?.query,
          suggested_shortcut: this.generateShortcut(context.long_term_memory.common_queries[0]?.query)
        },
        suggested_actions: [{
          type: 'message',
          description: 'Create shortcut',
          command: 'setup shortcut'
        }],
        triggered_by: 'experience_analysis',
        user_id: userId,
        phone_number: context.phone_number,
        persona: context.persona
      });
    }
    
    return insights;
  }

  private async findOptimizationInsights(context: any, userId: string): Promise<ProactiveInsight[]> {
    const insights: ProactiveInsight[] = [];
    
    // Analyze response time patterns
    const slowResponses = context.successful_interactions
      .filter((interaction: any) => interaction.response_time > 10); // More than 10 seconds
    
    if (slowResponses.length > 3) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'optimization',
        priority: 'medium',
        confidence: 0.8,
        title: 'Performance Optimization',
        message: 'I notice some queries are taking longer. I can optimize common requests for faster responses.',
        data: {
          slow_query_count: slowResponses.length,
          average_improvement: '60%',
          affected_queries: slowResponses.slice(0, 3)
        },
        suggested_actions: [{
          type: 'agent_execution',
          description: 'Optimize query performance',
          command: 'optimize query performance'
        }],
        triggered_by: 'performance_analysis',
        user_id: userId,
        phone_number: context.phone_number,
        persona: context.persona
      });
    }
    
    return insights;
  }

  async sendProactiveInsight(insight: ProactiveInsight): Promise<void> {
    // Format message based on persona
    const message = this.formatInsightMessage(insight);
    
    try {
      await this.whatsappService.sendMessage({
        to: insight.phone_number,
        body: message
      });
      
      // Store the insight in database
      await this.storeInsight(insight);
      
      console.log(`Sent proactive insight to ${insight.phone_number}: ${insight.title}`);
    } catch (error) {
      console.error('Failed to send proactive insight:', error);
    }
  }

  private formatInsightMessage(insight: ProactiveInsight): string {
    const emoji = this.getInsightEmoji(insight.type, insight.priority);
    const personaStyle = this.getPersonaStyle(insight.persona);
    
    let message = `${emoji} **${insight.title}**\n\n${insight.message}`;
    
    // Add persona-specific formatting
    switch (insight.persona) {
      case 'streamliner':
        message = this.makeStreamlinerMessage(message, insight);
        break;
      case 'navigator':
        message = this.makeNavigatorMessage(message, insight);
        break;
      case 'spring':
        message = this.makeSpringMessage(message, insight);
        break;
      case 'hub':
        message = this.makeHubMessage(message, insight);
        break;
      case 'processor':
        message = this.makeProcessorMessage(message, insight);
        break;
    }
    
    // Add suggested actions
    if (insight.suggested_actions.length > 0) {
      message += '\n\n**Quick Actions:**\n';
      insight.suggested_actions.forEach((action, index) => {
        message += `${index + 1}. ${action.description}\n`;
      });
    }
    
    return message;
  }

  // Helper methods
  private getInsightEmoji(type: string, priority: string): string {
    const emojis = {
      pattern: priority === 'high' ? '⚡' : '🔄',
      opportunity: '💰',
      risk: priority === 'critical' ? '🚨' : '⚠️',
      learning: '💡',
      optimization: '⚙️'
    };
    return emojis[type] || '📊';
  }

  private getPersonaStyle(persona: UserPersona): any {
    // Returns formatting preferences for each persona
    return {
      streamliner: { brief: true, action_focused: true },
      navigator: { detailed: true, analytical: true },
      spring: { encouraging: true, explanatory: true },
      hub: { network_focused: true, strategic: true },
      processor: { structured: true, data_focused: true }
    }[persona];
  }

  private makeStreamlinerMessage(message: string, insight: ProactiveInsight): string {
    // Keep it brief and action-focused
    const lines = message.split('\n');
    return lines.slice(0, 3).join('\n') + '\n\n⚡ Reply ACT to proceed';
  }

  private makeNavigatorMessage(message: string, insight: ProactiveInsight): string {
    // Add analytical details
    if (insight.data.impact_percentage) {
      message += `\n\n📊 **Impact Analysis:**\n• Estimated impact: ${insight.data.impact_percentage}%`;
    }
    return message;
  }

  private makeSpringMessage(message: string, insight: ProactiveInsight): string {
    // Make encouraging and educational
    return `🌟 Hey! I noticed something that might help you!\n\n${message}\n\n💚 Don't worry, I'm here to guide you through it!`;
  }

  private makeHubMessage(message: string, insight: ProactiveInsight): string {
    // Focus on network implications
    return `🌐 **Network Insight**\n\n${message}`;
  }

  private makeProcessorMessage(message: string, insight: ProactiveInsight): string {
    // Structured, data-focused format
    return `[PROACTIVE_INSIGHT]\nTYPE: ${insight.type.toUpperCase()}\nPRIORITY: ${insight.priority.toUpperCase()}\nCONFIDENCE: ${(insight.confidence * 100).toFixed(0)}%\n\n${insight.message}`;
  }

  // Utility methods
  private getAutomationSuggestion(queryType: string): string {
    const suggestions = {
      check_inventory: 'Daily stock level alerts',
      view_alerts: 'Real-time alert notifications',
      daily_digest: 'Automated morning summary',
      generate_report: 'Scheduled weekly reports'
    };
    return suggestions[queryType] || 'Custom automation';
  }

  private calculateOverstockValue(items: any[]): number {
    return items.reduce((total, item) => 
      total + ((item.quantity - item.reorder_point * 2) * item.unit_cost), 0
    );
  }

  private estimateSupplierImpact(suppliers: any[]): number {
    // Simplified calculation - would be more sophisticated in production
    return Math.min(suppliers.length * 15, 60);
  }

  private calculateTrend(values: number[]): number {
    // Simple linear trend calculation
    const n = values.length;
    const sumX = n * (n - 1) / 2;
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = sumX * (2 * n - 1) / 3;
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  private calculateRunway(currentCash: number, weeklyTrend: number): number {
    if (weeklyTrend >= 0) return Infinity;
    return Math.floor(currentCash / Math.abs(weeklyTrend * currentCash / 7));
  }

  private identifyUnusedFeatures(context: any): string[] {
    const allFeatures = ['supplier_performance', 'cash_flow_forecast', 'demand_planning', 'abc_analysis'];
    const usedFeatures = context.long_term_memory.common_queries.map((q: any) => q.query);
    return allFeatures.filter(feature => !usedFeatures.includes(feature));
  }

  private getFeatureBenefit(feature: string): string {
    const benefits = {
      supplier_performance: 'Track supplier reliability and optimize relationships',
      cash_flow_forecast: 'Predict future cash needs and avoid shortfalls',
      demand_planning: 'Forecast demand and optimize inventory levels',
      abc_analysis: 'Identify your most valuable inventory items'
    };
    return benefits[feature] || 'Improve business efficiency';
  }

  private generateShortcut(queryType: string): string {
    const shortcuts = {
      check_inventory: 'inv',
      view_alerts: 'alerts',
      daily_digest: 'digest'
    };
    return shortcuts[queryType] || 'custom';
  }

  private async storeInsight(insight: ProactiveInsight): Promise<void> {
    const supabase = createServerClient();
    
    await supabase
      .from('whatsapp_conversation_insights')
      .insert({
        user_id: insight.user_id,
        insight_type: insight.type,
        confidence: insight.confidence,
        data: {
          title: insight.title,
          message: insight.message,
          priority: insight.priority,
          suggested_actions: insight.suggested_actions,
          triggered_by: insight.triggered_by,
          ...insight.data
        }
      });
  }

  private startInsightGeneration(): void {
    setInterval(async () => {
      try {
        await this.generateInsightsForAllUsers();
      } catch (error) {
        console.error('Error in insight generation cycle:', error);
      }
    }, this.INSIGHT_INTERVAL);
  }

  private async generateInsightsForAllUsers(): Promise<void> {
    const supabase = createServerClient();
    
    // Get active WhatsApp users (users who have messaged in last 7 days)
    const { data: activeUsers } = await supabase
      .from('whatsapp_conversation_state')
      .select('user_id, phone_number')
      .gte('last_activity', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .not('user_id', 'is', null);
    
    if (!activeUsers) return;
    
    for (const user of activeUsers) {
      const insights = await this.generateInsightsForUser(user.user_id);
      
      // Send high priority insights immediately
      const highPriorityInsights = insights.filter(
        insight => insight.priority === 'critical' || insight.priority === 'high'
      );
      
      for (const insight of highPriorityInsights) {
        await this.sendProactiveInsight(insight);
        
        // Add delay between messages to avoid spam
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}