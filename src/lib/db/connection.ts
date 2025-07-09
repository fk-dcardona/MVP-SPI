import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { cache } from 'react';

// Singleton pattern for database client
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

// Create admin client with connection pooling
export function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: {
        // Connection pooling configuration
        schema: 'public',
      },
      global: {
        // Request timeout configuration
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

          return fetch(input, {
            ...init,
            signal: controller.signal,
          }).finally(() => clearTimeout(timeoutId));
        },
      },
    });
  }

  return supabaseAdmin;
}

// Server component client with caching
export const getSupabaseServer = cache(() => {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
});

// Utility function for retrying failed queries
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(fn, retries - 1, delay * 2);
  }
}

// Batch query helper
export async function batchQuery<T>(
  client: any,
  table: string,
  ids: string[],
  batchSize = 100
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const { data, error } = await client
      .from(table)
      .select('*')
      .in('id', batch);
    
    if (error) throw error;
    results.push(...(data || []));
  }
  
  return results;
}

// Connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from('companies')
      .select('id')
      .limit(1);
    
    return !error;
  } catch {
    return false;
  }
}

// Query performance monitoring
export function createQueryLogger() {
  return {
    logQuery: (query: string, duration: number) => {
      if (duration > 1000) {
        console.warn(`Slow query detected (${duration}ms):`, query);
      }
      if (process.env.NODE_ENV === 'development') {
        console.log(`Query executed in ${duration}ms:`, query);
      }
    },
  };
}

// Prepared statement helper
export const preparedQueries = {
  getCompanyInventory: (companyId: string) => ({
    table: 'inventory_items',
    select: '*',
    filter: { company_id: companyId },
    order: { column: 'last_updated', ascending: false },
  }),
  
  getRecentSales: (companyId: string, days: number) => ({
    table: 'sales_transactions',
    select: '*',
    filter: {
      company_id: companyId,
      transaction_date: `gte.${new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()}`,
    },
  }),
  
  getCategoryMetrics: (companyId: string) => ({
    table: 'mv_category_summary',
    select: '*',
    filter: { company_id: companyId },
  }),
};