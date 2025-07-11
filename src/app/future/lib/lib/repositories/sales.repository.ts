import { BaseRepository } from './base.repository';

export interface SalesTransaction {
  id: string;
  company_id: string;
  transaction_date: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  customer_id?: string;
  sales_channel?: string;
  region?: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export class SalesRepository extends BaseRepository<SalesTransaction> {
  constructor() {
    super('sales_transactions');
  }

  async findByCompany(companyId: string, startDate?: Date, endDate?: Date) {
    try {
      let query = this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact' })
        .eq('company_id', companyId);

      if (startDate) {
        query = query.gte('transaction_date', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('transaction_date', endDate.toISOString());
      }

      query = query.order('transaction_date', { ascending: false });

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

  async findBySku(companyId: string, sku: string, limit = 100) {
    return this.findAll({
      filters: { company_id: companyId, sku },
      orderBy: { column: 'transaction_date', ascending: false },
      limit
    });
  }

  async findByCustomer(companyId: string, customerId: string) {
    return this.findAll({
      filters: { company_id: companyId, customer_id: customerId },
      orderBy: { column: 'transaction_date', ascending: false }
    });
  }

  async getSalesMetrics(companyId: string, startDate: Date, endDate: Date) {
    try {
      const { data: sales, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('company_id', companyId)
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString());

      if (error) throw error;

      const metrics = {
        totalRevenue: 0,
        totalTransactions: sales?.length || 0,
        totalUnits: 0,
        uniqueSkus: new Set<string>(),
        uniqueCustomers: new Set<string>(),
        averageOrderValue: 0,
        topSellingSkus: new Map<string, number>(),
        salesByChannel: new Map<string, number>(),
        salesByRegion: new Map<string, number>()
      };

      sales?.forEach(sale => {
        metrics.totalRevenue += sale.total_amount;
        metrics.totalUnits += sale.quantity;
        metrics.uniqueSkus.add(sale.sku);
        
        if (sale.customer_id) {
          metrics.uniqueCustomers.add(sale.customer_id);
        }

        // Track top selling SKUs
        const currentSkuRevenue = metrics.topSellingSkus.get(sale.sku) || 0;
        metrics.topSellingSkus.set(sale.sku, currentSkuRevenue + sale.total_amount);

        // Track sales by channel
        if (sale.sales_channel) {
          const channelRevenue = metrics.salesByChannel.get(sale.sales_channel) || 0;
          metrics.salesByChannel.set(sale.sales_channel, channelRevenue + sale.total_amount);
        }

        // Track sales by region
        if (sale.region) {
          const regionRevenue = metrics.salesByRegion.get(sale.region) || 0;
          metrics.salesByRegion.set(sale.region, regionRevenue + sale.total_amount);
        }
      });

      metrics.averageOrderValue = metrics.totalTransactions > 0 
        ? metrics.totalRevenue / metrics.totalTransactions 
        : 0;

      // Sort and limit top selling SKUs
      const sortedSkus = Array.from(metrics.topSellingSkus.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      return {
        data: {
          totalRevenue: metrics.totalRevenue,
          totalTransactions: metrics.totalTransactions,
          totalUnits: metrics.totalUnits,
          uniqueSkus: metrics.uniqueSkus.size,
          uniqueCustomers: metrics.uniqueCustomers.size,
          averageOrderValue: metrics.averageOrderValue,
          topSellingSkus: sortedSkus.map(([sku, revenue]) => ({ sku, revenue })),
          salesByChannel: Array.from(metrics.salesByChannel.entries()).map(([channel, revenue]) => ({ channel, revenue })),
          salesByRegion: Array.from(metrics.salesByRegion.entries()).map(([region, revenue]) => ({ region, revenue }))
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

  async getSkuVelocity(companyId: string, sku: string, days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: sales, error } = await this.supabase
        .from(this.tableName)
        .select('quantity, transaction_date')
        .eq('company_id', companyId)
        .eq('sku', sku)
        .gte('transaction_date', startDate.toISOString())
        .lte('transaction_date', endDate.toISOString());

      if (error) throw error;

      const totalUnits = sales?.reduce((sum, sale) => sum + sale.quantity, 0) || 0;
      const dailyVelocity = totalUnits / days;

      return {
        data: {
          sku,
          totalUnits,
          days,
          dailyVelocity,
          transactions: sales?.length || 0
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