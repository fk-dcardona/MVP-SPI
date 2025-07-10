import { BaseAgent, AgentExecutionResult, ReportGeneratorConfig } from '../types';
import { createClient } from '@/lib/supabase/client';
import { WhatsAppService } from '@/lib/notifications/whatsapp-service';

export class ReportGenerator extends BaseAgent {
  async execute(context?: any): Promise<AgentExecutionResult> {
    try {
      const config = this.agent.config as ReportGeneratorConfig;
      
      // Gather report data
      const reportData = await this.gatherReportData(config);
      
      // Generate report
      const report = await this.generateReport(reportData, config);
      
      // Distribute report
      await this.distributeReport(report, config);
      
      return {
        success: true,
        data: {
          reportType: config.reportType,
          format: config.format,
          recipientCount: config.recipients.length,
          reportSize: report.size,
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
    const config = this.agent.config as ReportGeneratorConfig;
    
    if (!config.reportType) {
      return false;
    }
    
    if (!['daily', 'weekly', 'monthly'].includes(config.schedule)) {
      return false;
    }
    
    if (!Array.isArray(config.recipients) || config.recipients.length === 0) {
      return false;
    }
    
    if (!['pdf', 'excel', 'csv'].includes(config.format)) {
      return false;
    }
    
    return true;
  }

  private async gatherReportData(config: ReportGeneratorConfig): Promise<any> {
    const supabase = createClient();
    const period = this.getReportPeriod(config.schedule);
    
    // Gather real data based on report type
    let data: any = { period };
    
    switch (config.reportType) {
      case 'inventory_summary':
        const { data: inventory } = await supabase
          .from('inventory_items')
          .select('*')
          .eq('company_id', this.agent.company_id);
        
        data.inventory = inventory || [];
        data.summary = {
          totalItems: inventory?.length || 0,
          totalValue: inventory?.reduce((sum, item) => sum + (item.quantity_on_hand * item.unit_cost), 0) || 0,
          lowStockItems: inventory?.filter(item => item.quantity_on_hand <= item.reorder_point).length || 0
        };
        break;
        
      case 'sales_performance':
        const { data: sales } = await supabase
          .from('sales_transactions')
          .select('*')
          .eq('company_id', this.agent.company_id)
          .gte('transaction_date', period.start.toISOString())
          .lte('transaction_date', period.end.toISOString());
        
        data.sales = sales || [];
        data.summary = {
          totalTransactions: sales?.length || 0,
          totalRevenue: sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0,
          avgOrderValue: sales?.length ? (sales.reduce((sum, sale) => sum + sale.total_amount, 0) / sales.length) : 0
        };
        break;
        
      case 'supply_chain_metrics':
        const { data: triangleScores } = await supabase
          .from('triangle_scores')
          .select('*')
          .eq('company_id', this.agent.company_id)
          .order('calculated_at', { ascending: false })
          .limit(1)
          .single();
        
        data.metrics = triangleScores || {};
        break;
    }
    
    return data;
  }

  private async generateReport(data: any, config: ReportGeneratorConfig): Promise<any> {
    // For CSV format, generate CSV content
    let csvContent = '';
    
    switch (config.reportType) {
      case 'inventory_summary':
        csvContent = 'SKU,Product Name,Current Stock,Unit Cost,Total Value,Status\n';
        data.inventory?.forEach((item: any) => {
          const status = item.quantity_on_hand <= item.reorder_point ? 'Low Stock' : 'OK';
          csvContent += `${item.sku},"${item.product_name}",${item.quantity_on_hand},${item.unit_cost},${item.quantity_on_hand * item.unit_cost},${status}\n`;
        });
        break;
        
      case 'sales_performance':
        csvContent = 'Transaction ID,Date,Customer,Product,Quantity,Amount\n';
        data.sales?.forEach((sale: any) => {
          csvContent += `${sale.id},${sale.transaction_date},"${sale.customer_name}","${sale.product_name}",${sale.quantity},${sale.total_amount}\n`;
        });
        break;
        
      case 'supply_chain_metrics':
        csvContent = 'Metric,Score,Date\n';
        if (data.metrics) {
          csvContent += `Service Score,${data.metrics.service_score},${data.metrics.calculated_at}\n`;
          csvContent += `Cost Score,${data.metrics.cost_score},${data.metrics.calculated_at}\n`;
          csvContent += `Capital Score,${data.metrics.capital_score},${data.metrics.calculated_at}\n`;
          csvContent += `Overall Score,${data.metrics.overall_score},${data.metrics.calculated_at}\n`;
        }
        break;
    }
    
    const report = {
      id: `report_${Date.now()}`,
      type: config.reportType,
      format: 'csv', // Always CSV for simplicity
      content: csvContent,
      generatedAt: new Date(),
      size: new Blob([csvContent]).size,
      summary: data.summary
    };
    
    return report;
  }

  private async distributeReport(report: any, config: ReportGeneratorConfig): Promise<void> {
    const whatsappService = new WhatsAppService();
    const supabase = createClient();
    
    // Store report in database
    const { data: storedReport } = await supabase
      .from('generated_reports')
      .insert({
        company_id: this.agent.company_id,
        report_type: report.type,
        format: report.format,
        content: report.content,
        summary: report.summary,
        generated_at: report.generatedAt
      })
      .select()
      .single();
    
    // Send via WhatsApp to all recipients
    for (const recipient of config.recipients) {
      const message = `📊 ${config.reportType.replace('_', ' ').toUpperCase()} Report\n\n`;
      let summaryText = '';
      
      if (report.summary) {
        Object.entries(report.summary).forEach(([key, value]) => {
          summaryText += `• ${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}\n`;
        });
      }
      
      await whatsappService.sendNotification({
        type: 'report',
        recipient: recipient,
        title: `${config.reportType} Report Ready`,
        body: `${message}${summaryText}\n\nView full report: ${process.env.NEXT_PUBLIC_APP_URL}/reports/${storedReport?.id || report.id}`,
        priority: 'medium',
        data: { reportId: storedReport?.id || report.id }
      });
    }
  }

  private getReportPeriod(schedule: string): any {
    const now = new Date();
    const period: any = { end: now };
    
    switch (schedule) {
      case 'daily':
        period.start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        period.start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        period.start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
    }
    
    return period;
  }

  private generateCharts(data: any): any[] {
    // TODO: Implement actual chart generation
    // This would use charting libraries
    
    return [
      {
        type: 'bar',
        title: 'Top Products by Sales',
        data: data.summary.topProducts
      },
      {
        type: 'line',
        title: 'Revenue Trend',
        data: [] // Would contain time series data
      }
    ];
  }
}