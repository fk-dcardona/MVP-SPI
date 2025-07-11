import { getSupabaseAdmin } from '@/lib/db/connection';
import { SupabaseClient } from '@supabase/supabase-js';

export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: {
    column: string;
    ascending?: boolean;
  };
  filters?: Record<string, any>;
}

export interface RepositoryResult<T> {
  data: T | T[] | null;
  error: Error | null;
  count?: number;
}

export abstract class BaseRepository<T> {
  protected supabase: SupabaseClient;
  protected tableName: string;

  constructor(tableName: string) {
    this.supabase = getSupabaseAdmin();
    this.tableName = tableName;
  }

  async findAll(options?: QueryOptions): Promise<RepositoryResult<T[]>> {
    try {
      let query = this.supabase.from(this.tableName).select('*', { count: 'exact' });

      if (options?.filters) {
        Object.entries(options.filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      if (options?.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending ?? true 
        });
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return { data, error: null, count };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }

  async findById(id: string): Promise<RepositoryResult<T>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }

  async create(payload: Partial<T>): Promise<RepositoryResult<T>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }

  async update(id: string, payload: Partial<T>): Promise<RepositoryResult<T>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }

  async delete(id: string): Promise<RepositoryResult<null>> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { data: null, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }

  async upsert(payload: Partial<T> | Partial<T>[]): Promise<RepositoryResult<T[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .upsert(payload)
        .select();

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }
}