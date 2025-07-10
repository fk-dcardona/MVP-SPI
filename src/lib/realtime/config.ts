import { createBrowserClient } from '@/lib/supabase/client';

export const REALTIME_TABLES = [
  'inventory_items',
  'sales_transactions', 
  'alerts',
  'agent_executions'
] as const;

export function setupRealtimeSubscriptions(onUpdate: (table: string, payload: any) => void) {
  const supabase = createBrowserClient();
  
  // Subscribe to inventory changes
  const inventoryChannel = supabase
    .channel('inventory-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inventory_items' },
      (payload) => onUpdate('inventory_items', payload)
    )
    .subscribe();

  // Subscribe to sales changes
  const salesChannel = supabase
    .channel('sales-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'sales_transactions' },
      (payload) => onUpdate('sales_transactions', payload)
    )
    .subscribe();

  // Subscribe to alert changes
  const alertChannel = supabase
    .channel('alert-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'alerts' },
      (payload) => onUpdate('alerts', payload)
    )
    .subscribe();

  // Return cleanup function
  return () => {
    supabase.removeChannel(inventoryChannel);
    supabase.removeChannel(salesChannel);
    supabase.removeChannel(alertChannel);
  };
}