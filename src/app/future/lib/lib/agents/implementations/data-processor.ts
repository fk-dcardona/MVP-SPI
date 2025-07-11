import { BaseAgent, AgentExecutionResult, DataProcessorConfig } from '../types';
import { getSupabaseAdmin } from '@/lib/db/connection';

interface ProcessingContext {
  uploadId?: string;
  companyId?: string;
}

interface InventoryItem {
  sku: string;
  description: string;
  quantity: number;
  unit_cost: number;
  category?: string;
  supplier?: string;
  location?: string;
  last_updated?: string;
}

interface SalesTransaction {
  sku: string;
  quantity: number;
  revenue: number;
  transaction_date: string;
  customer_id?: string;
  channel?: string;
  unit_price?: number;
}

export class DataProcessor extends BaseAgent {
  async execute(context?: ProcessingContext): Promise<AgentExecutionResult> {
    try {
      const config = this.agent.config as DataProcessorConfig;
      const supabase = getSupabaseAdmin();
      
      console.log('DataProcessor: Starting execution with context:', context);
      
      // Process recent uploads if no specific upload is provided
      if (!context?.uploadId) {
        const { data: recentUploads } = await supabase
          .from('data_uploads')
          .select('id, file_type, company_id, file_name, status')
          .eq('status', 'pending')
          .order('uploaded_at', { ascending: false })
          .limit(10);
          
        if (!recentUploads || recentUploads.length === 0) {
          return {
            success: true,
            data: {
              message: 'No pending uploads to process',
              timestamp: new Date()
            }
          };
        }
        
        console.log(`DataProcessor: Processing ${recentUploads.length} pending uploads`);
        
        // Process each upload
        const results = [];
        for (const upload of recentUploads) {
          try {
            const result = await this.processUpload(upload.id as string, upload.file_type as string, upload.company_id as string);
            results.push({ uploadId: upload.id, ...result });
            
            // Update upload status to completed
            await supabase
              .from('data_uploads')
              .update({ status: 'completed', processed_at: new Date().toISOString() })
              .eq('id', upload.id);
          } catch (error) {
            console.error(`Error processing upload ${upload.id}:`, error);
            
            // Update upload status to failed
            await supabase
              .from('data_uploads')
              .update({ 
                status: 'failed', 
                error_message: error instanceof Error ? error.message : 'Unknown error'
              })
              .eq('id', upload.id);
          }
        }
        
        return {
          success: true,
          data: {
            uploadsProcessed: results.length,
            results,
            timestamp: new Date()
          }
        };
      }
      
      // Process specific upload
      const { data: upload } = await supabase
        .from('data_uploads')
        .select('file_type, company_id, file_name, status')
        .eq('id', context.uploadId)
        .single();
        
      if (!upload) {
        throw new Error('Upload not found');
      }
      
      if (upload.status === 'completed') {
        return {
          success: true,
          data: {
            message: 'Upload already processed',
            uploadId: context.uploadId,
            timestamp: new Date()
          }
        };
      }
      
      const results = await this.processUpload(context.uploadId, upload.file_type as string, upload.company_id as string);
      
      // Update upload status to completed
      await supabase
        .from('data_uploads')
        .update({ status: 'completed', processed_at: new Date().toISOString() })
        .eq('id', context.uploadId);
      
      return {
        success: true,
        data: {
          uploadId: context.uploadId,
          ...results,
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('DataProcessor execution error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  validate(): boolean {
    const config = this.agent.config as DataProcessorConfig;
    
    if (!config.source || !config.destination) {
      return false;
    }
    
    if (!['csv', 'json', 'xml'].includes(config.format)) {
      return false;
    }
    
    if (!Array.isArray(config.transformations)) {
      return false;
    }
    
    return true;
  }

  private async processUpload(uploadId: string, fileType: string, companyId: string): Promise<any> {
    const supabase = getSupabaseAdmin();
    const results: any = {
      recordsProcessed: 0,
      recordsValidated: 0,
      recordsRejected: 0,
      calculations: {},
      errors: []
    };
    
    console.log(`Processing ${fileType} upload ${uploadId} for company ${companyId}`);
    
    if (fileType === 'inventory') {
      return await this.processInventoryData(uploadId, companyId, results);
    } else if (fileType === 'sales') {
      return await this.processSalesData(uploadId, companyId, results);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  private async processInventoryData(uploadId: string, companyId: string, results: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    
    // Fetch inventory data from the upload
    const { data: inventory, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('upload_id', uploadId)
      .eq('company_id', companyId);
      
    if (error) {
      throw new Error(`Failed to fetch inventory data: ${error.message}`);
    }
    
    if (!inventory || inventory.length === 0) {
      results.message = 'No inventory data found';
      return results;
    }
    
    console.log(`Processing ${inventory.length} inventory records`);
    
    // Validate and clean data
    const validatedInventory = this.validateInventoryData(inventory, results);
    
    // Calculate comprehensive inventory metrics
    const metrics = this.calculateInventoryMetrics(validatedInventory);
    
    // Store calculated metrics
    await supabase
      .from('inventory_metrics')
      .upsert({
        company_id: companyId,
        upload_id: uploadId,
        total_value: metrics.totalValue,
        total_units: metrics.totalUnits,
        unique_skus: metrics.uniqueSkus,
        average_unit_cost: metrics.averageUnitCost,
        slow_moving_count: metrics.slowMovingCount,
        out_of_stock_count: metrics.outOfStockCount,
        low_stock_count: metrics.lowStockCount,
        excess_inventory_count: metrics.excessInventoryCount,
        inventory_turnover_rate: metrics.inventoryTurnoverRate,
        calculated_at: new Date().toISOString()
      });
      
    // Store SKU-level metrics
    for (const skuMetric of metrics.skuMetrics) {
      await supabase
        .from('sku_metrics')
        .upsert({
          company_id: companyId,
          upload_id: uploadId,
          sku: skuMetric.sku,
          quantity: skuMetric.quantity,
          unit_cost: skuMetric.unitCost,
          total_value: skuMetric.totalValue,
          category: skuMetric.category,
          supplier: skuMetric.supplier,
          location: skuMetric.location,
          calculated_at: new Date().toISOString()
        });
    }
        
    results.recordsProcessed = inventory.length;
    results.recordsValidated = validatedInventory.length;
    results.calculations = metrics;
    
    console.log(`Inventory processing complete: ${results.recordsProcessed} records processed`);
    
    return results;
  }

  private async processSalesData(uploadId: string, companyId: string, results: any): Promise<any> {
    const supabase = getSupabaseAdmin();
    
    // Fetch sales data from the upload
    const { data: sales, error } = await supabase
      .from('sales_transactions')
      .select('*')
      .eq('upload_id', uploadId)
      .eq('company_id', companyId);
      
    if (error) {
      throw new Error(`Failed to fetch sales data: ${error.message}`);
    }
    
    if (!sales || sales.length === 0) {
      results.message = 'No sales data found';
      return results;
    }
    
    console.log(`Processing ${sales.length} sales records`);
    
    // Validate and clean data
    const validatedSales = this.validateSalesData(sales, results);
    
    // Calculate comprehensive sales metrics
    const metrics = this.calculateSalesMetrics(validatedSales);
    
    // Store sales metrics
    await supabase
      .from('sales_metrics')
      .upsert({
        company_id: companyId,
        upload_id: uploadId,
        total_revenue: metrics.totalRevenue,
        total_units_sold: metrics.totalUnitsSold,
        unique_skus_sold: metrics.uniqueSkusSold,
        average_order_value: metrics.averageOrderValue,
        total_transactions: metrics.totalTransactions,
        calculated_at: new Date().toISOString()
      });
      
    // Store SKU velocity data
    for (const [sku, velocityData] of Object.entries(metrics.skuVelocity)) {
      const data = velocityData as any;
      await supabase
        .from('sku_velocity')
        .upsert({
          company_id: companyId,
          upload_id: uploadId,
          sku,
          units_sold: data.unitsSold,
          revenue: data.revenue,
          transaction_count: data.transactionCount,
          average_unit_price: data.averageUnitPrice,
          daily_velocity: data.dailyVelocity,
          calculated_at: new Date().toISOString()
        });
    }
      
    results.recordsProcessed = sales.length;
    results.recordsValidated = validatedSales.length;
    results.calculations = metrics;
    
    console.log(`Sales processing complete: ${results.recordsProcessed} records processed`);
    
    return results;
  }

  private validateInventoryData(data: any[], results: any): InventoryItem[] {
    const validated: InventoryItem[] = [];
    
    for (const item of data) {
      try {
        // Required fields validation
        if (!item.sku || !item.description || typeof item.quantity !== 'number' || typeof item.unit_cost !== 'number') {
          results.recordsRejected++;
          results.errors.push(`Invalid inventory item: missing required fields for SKU ${item.sku || 'unknown'}`);
          continue;
        }
        
        // Data type validation
        if (item.quantity < 0 || item.unit_cost < 0) {
          results.recordsRejected++;
          results.errors.push(`Invalid inventory item: negative values for SKU ${item.sku}`);
          continue;
        }
        
        // Business rule validation
        if (item.quantity > 1000000) {
          results.recordsRejected++;
          results.errors.push(`Invalid inventory item: quantity too high for SKU ${item.sku}`);
          continue;
        }
        
        if (item.unit_cost > 100000) {
          results.recordsRejected++;
          results.errors.push(`Invalid inventory item: unit cost too high for SKU ${item.sku}`);
          continue;
        }
        
        validated.push({
          sku: item.sku.toString().trim(),
          description: item.description.toString().trim(),
          quantity: Math.round(item.quantity),
          unit_cost: parseFloat(item.unit_cost.toFixed(2)),
          category: item.category?.toString().trim(),
          supplier: item.supplier?.toString().trim(),
          location: item.location?.toString().trim(),
          last_updated: item.last_updated || new Date().toISOString()
        });
        
        results.recordsValidated++;
      } catch (error) {
        results.recordsRejected++;
        results.errors.push(`Error validating inventory item: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return validated;
  }

  private validateSalesData(data: any[], results: any): SalesTransaction[] {
    const validated: SalesTransaction[] = [];
    
    for (const sale of data) {
      try {
        // Required fields validation
        if (!sale.sku || typeof sale.quantity !== 'number' || typeof sale.revenue !== 'number' || !sale.transaction_date) {
          results.recordsRejected++;
          results.errors.push(`Invalid sales transaction: missing required fields for SKU ${sale.sku || 'unknown'}`);
          continue;
        }
        
        // Data type validation
        if (sale.quantity <= 0 || sale.revenue <= 0) {
          results.recordsRejected++;
          results.errors.push(`Invalid sales transaction: non-positive values for SKU ${sale.sku}`);
          continue;
        }
        
        // Date validation
        const transactionDate = new Date(sale.transaction_date);
        if (isNaN(transactionDate.getTime())) {
          results.recordsRejected++;
          results.errors.push(`Invalid sales transaction: invalid date for SKU ${sale.sku}`);
          continue;
        }
        
        // Business rule validation
        if (sale.quantity > 10000) {
          results.recordsRejected++;
          results.errors.push(`Invalid sales transaction: quantity too high for SKU ${sale.sku}`);
          continue;
        }
        
        if (sale.revenue > 1000000) {
          results.recordsRejected++;
          results.errors.push(`Invalid sales transaction: revenue too high for SKU ${sale.sku}`);
          continue;
        }
        
        validated.push({
          sku: sale.sku.toString().trim(),
          quantity: Math.round(sale.quantity),
          revenue: parseFloat(sale.revenue.toFixed(2)),
          transaction_date: transactionDate.toISOString(),
          customer_id: sale.customer_id?.toString().trim(),
          channel: sale.channel?.toString().trim(),
          unit_price: sale.unit_price ? parseFloat(sale.unit_price.toFixed(2)) : sale.revenue / sale.quantity
        });
        
        results.recordsValidated++;
      } catch (error) {
        results.recordsRejected++;
        results.errors.push(`Error validating sales transaction: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return validated;
  }

  private calculateInventoryMetrics(inventory: InventoryItem[]): any {
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
    const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const uniqueSkus = inventory.length;
    const averageUnitCost = totalUnits > 0 ? totalValue / totalUnits : 0;
    
    // Identify inventory categories
    const outOfStock = inventory.filter(item => item.quantity === 0);
    const lowStock = inventory.filter(item => item.quantity > 0 && item.quantity <= 10);
    const slowMoving = inventory.filter(item => item.quantity > 100 && item.quantity <= 1000);
    const excessInventory = inventory.filter(item => item.quantity > 1000);
    
    // Calculate SKU-level metrics
    const skuMetrics = inventory.map(item => ({
      sku: item.sku,
      quantity: item.quantity,
      unitCost: item.unit_cost,
      totalValue: item.quantity * item.unit_cost,
      category: item.category,
      supplier: item.supplier,
      location: item.location
    }));
    
    return {
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalUnits,
      uniqueSkus,
      averageUnitCost: parseFloat(averageUnitCost.toFixed(2)),
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      slowMovingCount: slowMoving.length,
      excessInventoryCount: excessInventory.length,
      inventoryTurnoverRate: 0, // Will be calculated when sales data is available
      skuMetrics
    };
  }

  private calculateSalesMetrics(sales: SalesTransaction[]): any {
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);
    const totalUnitsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const totalTransactions = sales.length;
    const averageOrderValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    // Group by SKU for velocity calculation
    const skuVelocity: Record<string, any> = {};
    
    sales.forEach(sale => {
      if (!skuVelocity[sale.sku]) {
        skuVelocity[sale.sku] = {
          unitsSold: 0,
          revenue: 0,
          transactionCount: 0,
          unitPrices: []
        };
      }
      
      skuVelocity[sale.sku].unitsSold += sale.quantity;
      skuVelocity[sale.sku].revenue += sale.revenue;
      skuVelocity[sale.sku].transactionCount += 1;
      skuVelocity[sale.sku].unitPrices.push(sale.unit_price || sale.revenue / sale.quantity);
    });
    
    // Calculate average unit price and daily velocity for each SKU
    Object.keys(skuVelocity).forEach(sku => {
      const data = skuVelocity[sku];
      data.averageUnitPrice = data.unitPrices.reduce((sum: number, price: number) => sum + price, 0) / data.unitPrices.length;
      data.dailyVelocity = data.unitsSold / 30; // Assuming 30-day period
      delete data.unitPrices; // Clean up temporary data
    });
    
    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalUnitsSold,
      uniqueSkusSold: Object.keys(skuVelocity).length,
      averageOrderValue: parseFloat(averageOrderValue.toFixed(2)),
      totalTransactions,
      skuVelocity
    };
  }

  private async loadData(source: string, format: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    
    if (source.startsWith('inventory:')) {
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .limit(1000);
      return data || [];
    }
    
    if (source.startsWith('sales:')) {
      const { data } = await supabase
        .from('sales_transactions')
        .select('*')
        .limit(1000);
      return data || [];
    }
    
    return [];
  }

  private applyTransformations(data: any[], transformations: any[]): any[] {
    let transformedData = [...data];
    
    for (const transformation of transformations) {
      switch (transformation.type) {
        case 'filter':
          transformedData = transformedData.filter(item => {
            return this.evaluateCondition(item, transformation.condition);
          });
          break;
          
        case 'map':
          transformedData = transformedData.map(item => {
            return this.applyMapping(item, transformation.mapping);
          });
          break;
          
        case 'aggregate':
          transformedData = this.applyAggregation(transformedData, transformation);
          break;
      }
    }
    
    return transformedData;
  }

  private evaluateCondition(item: any, condition: any): boolean {
    // Simple condition evaluation - can be enhanced
    const { field, operator, value } = condition;
    
    switch (operator) {
      case 'equals':
        return item[field] === value;
      case 'greater_than':
        return item[field] > value;
      case 'less_than':
        return item[field] < value;
      case 'contains':
        return String(item[field]).includes(String(value));
      default:
        return true;
    }
  }

  private applyMapping(item: any, mapping: any): any {
    const mapped = {};
    
    for (const [newField, expression] of Object.entries(mapping)) {
      if (typeof expression === 'string' && expression.startsWith('${')) {
        const fieldName = expression.slice(2, -1);
        mapped[newField] = item[fieldName];
      } else {
        mapped[newField] = expression;
      }
    }
    
    return { ...item, ...mapped };
  }

  private applyAggregation(data: any[], aggregation: any): any[] {
    const { groupBy, aggregations } = aggregation;
    const groups = new Map();
    
    for (const item of data) {
      const key = groupBy.map(field => item[field]).join('|');
      
      if (!groups.has(key)) {
        groups.set(key, {
          ...groupBy.reduce((acc, field) => ({ ...acc, [field]: item[field] }), {}),
          count: 0,
          sum: {},
          avg: {}
        });
      }
      
      const group = groups.get(key);
      group.count++;
      
      for (const agg of aggregations) {
        if (!group.sum[agg.field]) group.sum[agg.field] = 0;
        if (!group.avg[agg.field]) group.avg[agg.field] = 0;
        
        group.sum[agg.field] += item[agg.field] || 0;
        group.avg[agg.field] = group.sum[agg.field] / group.count;
      }
    }
    
    return Array.from(groups.values());
  }

  private async saveData(data: any[], destination: string, format: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    
    if (destination.startsWith('table:')) {
      const tableName = destination.slice(6);
      await supabase.from(tableName).insert(data);
    }
  }
}