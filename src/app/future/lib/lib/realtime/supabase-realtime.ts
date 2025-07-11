import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RealtimeSubscription {
  table: string;
  event?: RealtimeEvent | RealtimeEvent[];
  filter?: string;
  callback: (payload: any) => void;
}

export class SupabaseRealtimeManager {
  private supabase = createClientComponentClient();
  private channels: Map<string, RealtimeChannel> = new Map();
  private subscriptions: Map<string, RealtimeSubscription[]> = new Map();

  /**
   * Subscribe to real-time changes on a table
   */
  subscribe(subscription: RealtimeSubscription): () => void {
    const channelName = this.getChannelName(subscription.table);
    
    // Store subscription
    const subs = this.subscriptions.get(channelName) || [];
    subs.push(subscription);
    this.subscriptions.set(channelName, subs);

    // Create or get channel
    let channel = this.channels.get(channelName);
    if (!channel) {
      channel = this.createChannel(subscription.table);
      this.channels.set(channelName, channel);
    }

    // Return unsubscribe function
    return () => this.unsubscribe(subscription);
  }

  /**
   * Subscribe to inventory changes
   */
  subscribeToInventory(companyId: string, callback: (payload: any) => void): () => void {
    return this.subscribe({
      table: 'inventory_items',
      event: ['INSERT', 'UPDATE', 'DELETE'],
      filter: `company_id=eq.${companyId}`,
      callback
    });
  }

  /**
   * Subscribe to sales transactions
   */
  subscribeToSales(companyId: string, callback: (payload: any) => void): () => void {
    return this.subscribe({
      table: 'sales_transactions',
      event: ['INSERT', 'UPDATE'],
      filter: `company_id=eq.${companyId}`,
      callback
    });
  }

  /**
   * Subscribe to alerts
   */
  subscribeToAlerts(companyId: string, callback: (payload: any) => void): () => void {
    return this.subscribe({
      table: 'alerts',
      event: 'INSERT',
      filter: `company_id=eq.${companyId}`,
      callback
    });
  }

  /**
   * Subscribe to agent executions
   */
  subscribeToAgentExecutions(companyId: string, callback: (payload: any) => void): () => void {
    return this.subscribe({
      table: 'agents',
      event: 'UPDATE',
      filter: `company_id=eq.${companyId}`,
      callback: (payload) => {
        // Only trigger callback if status changed
        if (payload.new?.status !== payload.old?.status) {
          callback(payload);
        }
      }
    });
  }

  /**
   * Subscribe to triangle score updates
   */
  subscribeToTriangleScores(companyId: string, callback: (payload: any) => void): () => void {
    return this.subscribe({
      table: 'triangle_scores',
      event: 'INSERT',
      filter: `company_id=eq.${companyId}`,
      callback
    });
  }

  private createChannel(table: string): RealtimeChannel {
    const channelName = this.getChannelName(table);
    const channel = this.supabase.channel(channelName);

    // Get all subscriptions for this table
    const subs = this.subscriptions.get(channelName) || [];
    
    // Group subscriptions by event type
    const eventGroups = new Map<string, RealtimeSubscription[]>();
    subs.forEach(sub => {
      const events = Array.isArray(sub.event) ? sub.event : [sub.event || '*'];
      events.forEach(event => {
        const key = `${event}-${sub.filter || ''}`;
        const group = eventGroups.get(key) || [];
        group.push(sub);
        eventGroups.set(key, group);
      });
    });

    // Set up listeners for each event group
    eventGroups.forEach((subscriptions, key) => {
      const [event, filter] = key.split('-');
      
      channel.on(
        'postgres_changes' as any,
        {
          event: event === '*' ? undefined : event,
          schema: 'public',
          table: table,
          filter: filter || undefined
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          // Call all callbacks for this event
          subscriptions.forEach(sub => {
            try {
              sub.callback(payload);
            } catch (error) {
              console.error('Realtime callback error:', error);
            }
          });
        }
      );
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log(`Subscribed to ${channelName}`);
      } else if (status === 'CHANNEL_ERROR') {
        console.error(`Error subscribing to ${channelName}`);
      }
    });

    return channel;
  }

  private unsubscribe(subscription: RealtimeSubscription): void {
    const channelName = this.getChannelName(subscription.table);
    
    // Remove subscription
    const subs = this.subscriptions.get(channelName) || [];
    const filtered = subs.filter(s => s !== subscription);
    
    if (filtered.length === 0) {
      // No more subscriptions, remove channel
      this.subscriptions.delete(channelName);
      const channel = this.channels.get(channelName);
      if (channel) {
        channel.unsubscribe();
        this.channels.delete(channelName);
      }
    } else {
      this.subscriptions.set(channelName, filtered);
    }
  }

  private getChannelName(table: string): string {
    return `realtime:${table}`;
  }

  /**
   * Clean up all subscriptions
   */
  cleanup(): void {
    this.channels.forEach(channel => {
      channel.unsubscribe();
    });
    this.channels.clear();
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const realtimeManager = new SupabaseRealtimeManager();