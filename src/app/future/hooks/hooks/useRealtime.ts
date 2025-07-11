import { useEffect, useRef } from 'react';
import { realtimeManager, RealtimeSubscription } from '@/lib/realtime/supabase-realtime';
import { useAuth } from './useAuth';

export function useRealtimeSubscription(
  subscription: Omit<RealtimeSubscription, 'callback'> | null,
  callback: (payload: any) => void,
  deps: any[] = []
) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    // Subscribe if subscription config provided
    if (subscription) {
      unsubscribeRef.current = realtimeManager.subscribe({
        ...subscription,
        callback
      });
    }

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [...deps, subscription?.table, subscription?.event, subscription?.filter]);
}

export function useInventoryRealtime(callback: (payload: any) => void) {
  const { company } = useAuth();
  
  useRealtimeSubscription(
    company?.id ? {
      table: 'inventory_items',
      event: ['INSERT', 'UPDATE', 'DELETE'],
      filter: `company_id=eq.${company.id}`
    } : null,
    callback,
    [company?.id]
  );
}

export function useSalesRealtime(callback: (payload: any) => void) {
  const { company } = useAuth();
  
  useRealtimeSubscription(
    company?.id ? {
      table: 'sales_transactions',
      event: ['INSERT', 'UPDATE'],
      filter: `company_id=eq.${company.id}`
    } : null,
    callback,
    [company?.id]
  );
}

export function useAlertsRealtime(callback: (payload: any) => void) {
  const { company } = useAuth();
  
  useRealtimeSubscription(
    company?.id ? {
      table: 'alerts',
      event: 'INSERT',
      filter: `company_id=eq.${company.id}`
    } : null,
    callback,
    [company?.id]
  );
}

export function useTriangleScoresRealtime(callback: (payload: any) => void) {
  const { company } = useAuth();
  
  useRealtimeSubscription(
    company?.id ? {
      table: 'triangle_scores',
      event: 'INSERT',
      filter: `company_id=eq.${company.id}`
    } : null,
    callback,
    [company?.id]
  );
}

export function useAgentStatusRealtime(callback: (payload: any) => void) {
  const { company } = useAuth();
  
  useRealtimeSubscription(
    company?.id ? {
      table: 'agents',
      event: 'UPDATE',
      filter: `company_id=eq.${company.id}`
    } : null,
    (payload) => {
      // Only trigger callback if status changed
      if (payload.new?.status !== payload.old?.status) {
        callback(payload);
      }
    },
    [company?.id]
  );
}