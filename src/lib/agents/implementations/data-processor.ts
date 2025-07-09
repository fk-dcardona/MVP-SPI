import { BaseAgent, AgentExecutionResult, DataProcessorConfig } from '../types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ProcessingContext {
  uploadId?: string;
  companyId?: string;
}

export class DataProcessor extends BaseAgent {
  async execute(context?: ProcessingContext): Promise<AgentExecutionResult> {
    try {
      const config = this.agent.config as DataProcessorConfig;
      const supabase = createClientComponentClient();
      
      // Process recent uploads if no specific upload is provided
      if (!context?.uploadId) {
        const { data: recentUploads } = await supabase
          .from('data_uploads')
          .select('id, file_type, company_id')
          .eq('status', 'completed')
          .order('uploaded_at', { ascending: false })
          .limit(5);
          
        if (!recentUploads || recentUploads.length === 0) {
          return {
            success: true,
            data: {
              message: 'No recent uploads to process',
              timestamp: new Date()
            }
          };
        }
        
        // Process each upload
        for (const upload of recentUploads) {
          await this.processUpload(upload.id, upload.file_type, upload.company_id);
        }
        
        return {
          success: true,
          data: {
            uploadsProcessed: recentUploads.length,
            timestamp: new Date()
          }
        };
      }
      
      // Process specific upload
      const { data: upload } = await supabase
        .from('data_uploads')
        .select('file_type, company_id')
        .eq('id', context.uploadId)
        .single();
        
      if (!upload) {
        throw new Error('Upload not found');
      }
      
      const results = await this.processUpload(context.uploadId, upload.file_type, upload.company_id);
      
      return {
        success: true,
        data: {
          uploadId: context.uploadId,
          ...results,
          timestamp: new Date()
        }
      };
    } catch (error) {
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
    const supabase = createClientComponentClient();
    const results: any = {
      recordsProcessed: 0,
      calculations: {}
    };
    
    if (fileType === 'inventory') {
      // Process inventory data
      const { data: inventory } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('upload_id', uploadId);
        
      if (!inventory) return results;
      
      // Calculate inventory metrics
      const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
      const totalUnits = inventory.reduce((sum, item) => sum + item.quantity, 0);
      const uniqueSkus = inventory.length;
      
      // Identify slow-moving inventory (placeholder logic)
      const slowMoving = inventory.filter(item => item.quantity > 100);
      
      // Store calculated metrics
      await supabase
        .from('inventory_metrics')
        .upsert({
          company_id: companyId,
          total_value: totalValue,
          total_units: totalUnits,
          unique_skus: uniqueSkus,
          slow_moving_count: slowMoving.length,
          calculated_at: new Date().toISOString()
        });
        
      results.recordsProcessed = inventory.length;
      results.calculations = {
        totalValue,
        totalUnits,
        uniqueSkus,
        slowMovingItems: slowMoving.length
      };
      
    } else if (fileType === 'sales') {
      // Process sales data
      const { data: sales } = await supabase
        .from('sales_transactions')
        .select('*')
        .eq('upload_id', uploadId);
        
      if (!sales) return results;
      
      // Calculate sales metrics
      const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);
      const totalUnitsSold = sales.reduce((sum, sale) => sum + sale.quantity, 0);
      
      // Group by SKU for velocity calculation
      const skuSales = sales.reduce((acc, sale) => {
        if (!acc[sale.sku]) {
          acc[sale.sku] = { quantity: 0, revenue: 0, transactions: 0 };
        }
        acc[sale.sku].quantity += sale.quantity;
        acc[sale.sku].revenue += sale.revenue;
        acc[sale.sku].transactions += 1;
        return acc;
      }, {} as Record<string, any>);
      
      // Store SKU velocity data
      for (const [sku, data] of Object.entries(skuSales)) {
        await supabase
          .from('sku_velocity')
          .upsert({
            company_id: companyId,
            sku,
            units_sold: data.quantity,
            revenue: data.revenue,
            transaction_count: data.transactions,
            calculated_at: new Date().toISOString()
          });
      }
      
      results.recordsProcessed = sales.length;
      results.calculations = {
        totalRevenue,
        totalUnitsSold,
        uniqueSkusSold: Object.keys(skuSales).length
      };
    }
    
    return results;
  }

  private async loadData(source: string, format: string): Promise<any[]> {
    const supabase = createClientComponentClient();
    
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
      if (transformation.operation === 'currency_conversion') {
        transformedData = transformedData.map(record => ({
          ...record,
          unit_cost_usd: record.unit_cost * (transformation.params?.rate || 1),
          revenue_usd: record.revenue * (transformation.params?.rate || 1)
        }));
      }
      
      if (transformation.operation === 'calculate_margins') {
        transformedData = transformedData.map(record => ({
          ...record,
          margin: record.revenue - (record.quantity * record.unit_cost),
          margin_percentage: ((record.revenue - (record.quantity * record.unit_cost)) / record.revenue) * 100
        }));
      }
    }
    
    return transformedData;
  }

  private async saveData(data: any[], destination: string, format: string): Promise<void> {
    const supabase = createClientComponentClient();
    
    if (destination === 'processed_data') {
      await supabase
        .from('processed_data')
        .insert(data);
    }
  }
}