// Persona tracking and adaptation service
// Following the Merging Philosophy: One system that learns from behavior

import { supabase } from '@/lib/supabase';
import type { 
  UserPersona, 
  UserBehaviorSignal, 
  PersonaScores,
  UserPreferences,
  SystemHealthPreferences,
  BehaviorAction 
} from '@/types/persona';
import { BEHAVIOR_ACTIONS } from '@/types/persona';

export class PersonaService {
  private static instance: PersonaService;
  private userId: string | null = null;
  
  private constructor() {}
  
  static getInstance(): PersonaService {
    if (!PersonaService.instance) {
      PersonaService.instance = new PersonaService();
    }
    return PersonaService.instance;
  }
  
  setUserId(userId: string) {
    this.userId = userId;
  }
  
  /**
   * Track a user behavior signal
   * This is the core of the Merging Philosophy - one action, multiple interpretations
   */
  async trackBehavior(
    action: BehaviorAction,
    context: Record<string, any> = {},
    completionTimeMs?: number
  ): Promise<void> {
    if (!this.userId) {
      console.warn('PersonaService: No user ID set');
      return;
    }
    
    try {
      const { error } = await supabase.rpc('track_user_behavior', {
        p_user_id: this.userId,
        p_action_type: action,
        p_context: context,
        p_completion_time_ms: completionTimeMs
      });
      
      if (error) {
        console.error('Error tracking behavior:', error);
      }
      
      // Recalculate persona after significant actions
      if (this.shouldRecalculatePersona(action)) {
        await this.calculatePersona();
      }
    } catch (error) {
      console.error('PersonaService error:', error);
    }
  }
  
  /**
   * Track feature usage with timing
   */
  async trackFeatureUsage(featureName: string, startTime: number): Promise<void> {
    const completionTime = Date.now() - startTime;
    await this.trackBehavior(
      featureName as BehaviorAction,
      { feature: featureName },
      completionTime
    );
  }
  
  /**
   * Calculate user persona from behavior signals
   */
  async calculatePersona(): Promise<{
    detectedPersona: UserPersona;
    confidence: number;
    scores: Record<UserPersona, number>;
  } | null> {
    if (!this.userId) return null;
    
    try {
      const { data, error } = await supabase.rpc('calculate_user_persona', {
        p_user_id: this.userId
      });
      
      if (error) {
        console.error('Error calculating persona:', error);
        return null;
      }
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          detectedPersona: result.detected_persona,
          confidence: result.confidence,
          scores: result.scores
        };
      }
      
      return null;
    } catch (error) {
      console.error('PersonaService error:', error);
      return null;
    }
  }
  
  /**
   * Get user preferences
   */
  async getUserPreferences(): Promise<UserPreferences | null> {
    if (!this.userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // Not found is ok
        console.error('Error fetching preferences:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('PersonaService error:', error);
      return null;
    }
  }
  
  /**
   * Update user preferences
   */
  async updateUserPreferences(
    preferences: Partial<UserPreferences>
  ): Promise<boolean> {
    if (!this.userId) return false;
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: this.userId,
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId);
      
      if (error) {
        console.error('Error updating preferences:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('PersonaService error:', error);
      return false;
    }
  }
  
  /**
   * Get system health preferences
   */
  async getSystemHealthPreferences(): Promise<SystemHealthPreferences | null> {
    if (!this.userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('system_health_preferences')
        .select('*')
        .eq('user_id', this.userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching health preferences:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('PersonaService error:', error);
      return null;
    }
  }
  
  /**
   * Update system health preferences based on persona
   */
  async updateSystemHealthPreferences(
    persona: UserPersona
  ): Promise<boolean> {
    if (!this.userId) return false;
    
    // Default metrics by persona
    const personaMetrics: Record<UserPersona, string[]> = {
      streamliner: ['response_time', 'api_latency', 'data_processing'],
      navigator: ['error_rate', 'system_uptime', 'prediction_accuracy'],
      hub: ['data_processing', 'system_uptime', 'network_latency'],
      spring: ['system_uptime', 'error_rate', 'help_availability'],
      processor: ['memory_usage', 'cpu_usage', 'error_rate', 'system_uptime']
    };
    
    try {
      const { error } = await supabase
        .from('system_health_preferences')
        .upsert({
          user_id: this.userId,
          priority_metrics: personaMetrics[persona],
          updated_at: new Date().toISOString()
        })
        .eq('user_id', this.userId);
      
      if (error) {
        console.error('Error updating health preferences:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('PersonaService error:', error);
      return false;
    }
  }
  
  /**
   * Get persona scores
   */
  async getPersonaScores(): Promise<PersonaScores | null> {
    if (!this.userId) return null;
    
    try {
      const { data, error } = await supabase
        .from('persona_scores')
        .select('*')
        .eq('user_id', this.userId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching persona scores:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('PersonaService error:', error);
      return null;
    }
  }
  
  /**
   * Determine if we should recalculate persona
   */
  private shouldRecalculatePersona(action: BehaviorAction): boolean {
    // Recalculate on significant actions
    const significantActions: BehaviorAction[] = [
      BEHAVIOR_ACTIONS.CUSTOM_DASHBOARD,
      BEHAVIOR_ACTIONS.SAVE_VIEW,
      BEHAVIOR_ACTIONS.SWITCH_ENTITY,
      BEHAVIOR_ACTIONS.TUTORIAL_START,
      BEHAVIOR_ACTIONS.SYSTEM_CONFIG
    ];
    
    return significantActions.includes(action);
  }
  
  /**
   * Initialize persona tracking for a session
   */
  async initializeSession(userId: string): Promise<void> {
    this.setUserId(userId);
    
    // Track login
    await this.trackBehavior(BEHAVIOR_ACTIONS.LOGIN, {
      timestamp: new Date().toISOString()
    });
    
    // Calculate initial persona if needed
    const result = await this.calculatePersona();
    if (result && result.confidence < 0.3) {
      // Low confidence - user might benefit from onboarding
      console.log('Low persona confidence - consider showing onboarding');
    }
  }
  
  /**
   * Track dashboard view
   */
  async trackDashboardView(dashboardType: string): Promise<void> {
    const actionMap: Record<string, BehaviorAction> = {
      speed: BEHAVIOR_ACTIONS.SPEED_DASHBOARD_VIEW,
      predictive: BEHAVIOR_ACTIONS.PREDICTIVE_ANALYTICS_VIEW,
      network: BEHAVIOR_ACTIONS.NETWORK_VISUALIZATION_VIEW,
      health: BEHAVIOR_ACTIONS.HEALTH_CHECK,
      audit: BEHAVIOR_ACTIONS.AUDIT_TRAIL_VIEW
    };
    
    const action = actionMap[dashboardType] || BEHAVIOR_ACTIONS.DASHBOARD_VIEW;
    await this.trackBehavior(action, { dashboard_type: dashboardType });
  }
}

// Export singleton instance
export const personaService = PersonaService.getInstance();