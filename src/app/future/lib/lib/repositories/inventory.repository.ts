import { BaseRepository } from './base.repository';

export interface InventoryItem {
  id: string;
  company_id: string;
  sku: string;
  product_name: string;
  category?: string;
  subcategory?: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number;
  reorder_point: number;
  unit_cost: number;
  selling_price: number;
  supplier_name?: string;
  lead_time_days?: number;
  last_restock_date?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
  is_active: boolean;
}

export class InventoryRepository extends BaseRepository<InventoryItem> {
  constructor() {
    super('inventory_items');
  }

  async findByCompany(companyId: string) {
    return this.findAll({
      filters: { company_id: companyId, is_active: true },
      orderBy: { column: 'updated_at', ascending: false }
    });
  }

  async findBySku(companyId: string, sku: string) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('company_id', companyId)
        .eq('sku', sku)
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

  async findLowStock(companyId: string) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .lte('current_stock', 'minimum_stock');

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }

  async findOutOfStock(companyId: string) {
    return this.findAll({
      filters: { 
        company_id: companyId, 
        current_stock: 0,
        is_active: true 
      }
    });
  }

  async updateStock(companyId: string, sku: string, quantity: number) {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .update({ 
          current_stock: quantity,
          updated_at: new Date().toISOString()
        })
        .eq('company_id', companyId)
        .eq('sku', sku)
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

  async bulkUpdateStock(updates: Array<{ companyId: string; sku: string; quantity: number }>) {
    try {
      const promises = updates.map(update => 
        this.updateStock(update.companyId, update.sku, update.quantity)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error !== null);

      if (errors.length > 0) {
        throw new Error(`Failed to update ${errors.length} items`);
      }

      return { 
        data: results.map(r => r.data).filter(Boolean), 
        error: null 
      };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }

  async getInventoryMetrics(companyId: string) {
    try {
      const { data: inventory, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (error) throw error;

      const metrics = {
        totalItems: inventory?.length || 0,
        totalValue: 0,
        outOfStock: 0,
        lowStock: 0,
        overstocked: 0,
        categories: new Set<string>(),
        suppliers: new Set<string>()
      };

      inventory?.forEach(item => {
        metrics.totalValue += item.current_stock * item.unit_cost;
        
        if (item.current_stock === 0) metrics.outOfStock++;
        else if (item.current_stock <= item.minimum_stock) metrics.lowStock++;
        else if (item.current_stock >= item.maximum_stock) metrics.overstocked++;
        
        if (item.category) metrics.categories.add(item.category);
        if (item.supplier_name) metrics.suppliers.add(item.supplier_name);
      });

      return {
        data: {
          ...metrics,
          categories: Array.from(metrics.categories),
          suppliers: Array.from(metrics.suppliers)
        },
        error: null
      };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }
}