import { BaseAgent, AgentExecutionResult, InventoryMonitorConfig } from '../types';
import { getSupabaseAdmin } from '@/lib/db/connection';

export class InventoryMonitor extends BaseAgent {
  async execute(context?: any): Promise<AgentExecutionResult> {
    try {
      const config = this.agent.config as InventoryMonitorConfig;
      const supabase = getSupabaseAdmin();
      
      // Get company ID from agent configuration
      const companyId = this.agent.company_id;
      
      // Fetch current inventory levels
      const inventoryData = await this.checkInventoryLevels(companyId);
      
      // Calculate sales velocity for each SKU
      const salesVelocity = await this.calculateSalesVelocity(companyId);
      
      // Analyze for low stock items
      const alerts = await this.analyzeInventory(inventoryData, salesVelocity, config);
      
      // Store alerts in database
      if (alerts.length > 0) {
        await this.storeAlerts(alerts, companyId);
      }
      
      return {
        success: true,
        data: {
          itemsChecked: inventoryData.length,
          alertsGenerated: alerts.length,
          alerts,
          criticalItems: alerts.filter(a => a.type === 'critical').length,
          warningItems: alerts.filter(a => a.type === 'warning').length,
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
    const config = this.agent.config as InventoryMonitorConfig;
    
    if (!config.thresholds || 
        typeof config.thresholds.low !== 'number' ||
        typeof config.thresholds.critical !== 'number') {
      return false;
    }
    
    if (!config.checkInterval || config.checkInterval <= 0) {
      return false;
    }
    
    return true;
  }

  private async checkInventoryLevels(companyId: string): Promise<any[]> {
    const supabase = getSupabaseAdmin();
    
    const { data, error } = await supabase
      .from('inventory_items')
      .select('id, sku, description, quantity, unit_cost')
      .eq('company_id', companyId)
      .order('quantity', { ascending: true });
      
    if (error) {
      console.error('Error fetching inventory:', error);
      return [];
    }
    
    return data || [];
  }

  private async calculateSalesVelocity(companyId: string): Promise<Map<string, number>> {
    const supabase = getSupabaseAdmin();
    const velocityMap = new Map<string, number>();
    
    // Get sales data from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data, error } = await supabase
      .from('sales_transactions')
      .select('sku, quantity')
      .eq('company_id', companyId)
      .gte('transaction_date', thirtyDaysAgo.toISOString());
      
    if (error) {
      console.error('Error fetching sales data:', error);
      return velocityMap;
    }
    
    // Calculate velocity per SKU
    if (data) {
      data.forEach(sale => {
        const current = velocityMap.get(sale.sku as string) || 0;
        velocityMap.set(sale.sku as string, current + (sale.quantity as number));
      });
      
      // Convert to daily velocity
      velocityMap.forEach((value, key) => {
        velocityMap.set(key, value / 30);
      });
    }
    
    return velocityMap;
  }

  private async analyzeInventory(
    inventoryData: any[], 
    salesVelocity: Map<string, number>, 
    config: InventoryMonitorConfig
  ): Promise<any[]> {
    const alerts = [];
    const supabase = getSupabaseAdmin();
    
    for (const item of inventoryData) {
      const dailyVelocity = salesVelocity.get(item.sku) || 0;
      const daysOfStock = dailyVelocity > 0 ? item.quantity / dailyVelocity : Infinity;
      
      // Calculate reorder point based on velocity and lead time
      const leadTimeDays = config.leadTime || 7; // Default 7 days lead time
      const safetyStockDays = 3; // 3 days safety stock
      const reorderPoint = dailyVelocity * (leadTimeDays + safetyStockDays);
      
      let alertType = null;
      let message = '';
      
      if (item.quantity === 0) {
        alertType = 'stockout';
        message = `STOCKOUT: ${item.description} (${item.sku}) is out of stock!`;
      } else if (daysOfStock <= 3) {
        alertType = 'critical';
        message = `Critical: ${item.description} has only ${daysOfStock.toFixed(1)} days of stock remaining`;
      } else if (item.quantity <= reorderPoint) {
        alertType = 'reorder';
        message = `Reorder Alert: ${item.description} has reached reorder point (${item.quantity} units)`;
      } else if (daysOfStock <= 7) {
        alertType = 'warning';
        message = `Warning: ${item.description} has ${daysOfStock.toFixed(1)} days of stock`;
      } else if (dailyVelocity === 0 && item.quantity > config.thresholds.excess) {
        alertType = 'excess';
        message = `Excess Inventory: ${item.description} has no sales in 30 days`;
      }
      
      if (alertType) {
        alerts.push({
          type: alertType,
          sku: item.sku,
          description: item.description,
          currentQuantity: item.quantity,
          dailyVelocity,
          daysOfStock,
          reorderPoint,
          inventoryValue: item.quantity * item.unit_cost,
          message
        });
      }
    }
    
    // Sort alerts by priority
    const priorityOrder = { stockout: 0, critical: 1, reorder: 2, warning: 3, excess: 4 };
    alerts.sort((a, b) => priorityOrder[a.type] - priorityOrder[b.type]);
    
    return alerts;
  }

  private async storeAlerts(alerts: any[], companyId: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    
    // Store alerts in a dedicated alerts table (if exists)
    // For now, we'll just log them
    console.log(`Generated ${alerts.length} alerts for company ${companyId}`);
    
    // TODO: Store in alerts table when created
    // await supabase.from('inventory_alerts').insert(
    //   alerts.map(alert => ({
    //     company_id: companyId,
    //     type: alert.type,
    //     sku: alert.sku,
    //     message: alert.message,
    //     data: alert,
    //     created_at: new Date().toISOString()
    //   }))
    // );
  }
}