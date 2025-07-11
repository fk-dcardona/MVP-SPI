import { 
  AlertRule, 
  AlertInstance, 
  AlertTriggerType,
  NotificationChannel,
  NotificationRecord 
} from './types';
import { createServerClient } from '@/lib/supabase/server';
import { WhatsAppService } from '@/lib/notifications/whatsapp-service';

export class AlertEngine {
  private supabase = createServerClient();
  private whatsappService = new WhatsAppService();

  async evaluateRules(companyId: string): Promise<void> {
    // Get all active rules for the company
    const { data: rules, error } = await this.supabase
      .from('alert_rules')
      .select('*')
      .eq('company_id', companyId)
      .eq('enabled', true);

    if (error || !rules) {
      console.error('Failed to fetch alert rules:', error);
      return;
    }

    // Evaluate each rule
    for (const rule of rules) {
      try {
        await this.evaluateRule(rule);
      } catch (error) {
        console.error(`Failed to evaluate rule ${rule.id}:`, error);
      }
    }
  }

  private async evaluateRule(rule: AlertRule): Promise<void> {
    // Check if rule is in cooldown
    if (rule.next_eligible_trigger && new Date() < new Date(rule.next_eligible_trigger)) {
      return;
    }

    // Check if within active hours
    if (!this.isWithinActiveHours(rule)) {
      return;
    }

    // Evaluate based on trigger type
    const triggered = await this.checkTriggerCondition(rule);

    if (triggered) {
      await this.createAlert(rule, triggered);
    }
  }

  private isWithinActiveHours(rule: AlertRule): boolean {
    if (!rule.active_hours) return true;

    const now = new Date();
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: rule.active_hours.timezone 
    });

    return currentTime >= rule.active_hours.start && currentTime <= rule.active_hours.end;
  }

  private async checkTriggerCondition(rule: AlertRule): Promise<any> {
    switch (rule.trigger_type) {
      case 'inventory_level':
        return await this.checkInventoryLevel(rule);
      
      case 'stockout_risk':
        return await this.checkStockoutRisk(rule);
      
      case 'supplier_performance':
        return await this.checkSupplierPerformance(rule);
      
      case 'financial_metric':
        return await this.checkFinancialMetric(rule);
      
      case 'metric_threshold':
        return await this.checkMetricThreshold(rule);
      
      default:
        return null;
    }
  }

  private async checkInventoryLevel(rule: AlertRule): Promise<any> {
    const { data: inventory } = await this.supabase
      .from('inventory')
      .select('*')
      .eq('company_id', rule.company_id);

    if (!inventory) return null;

    const triggeredItems = inventory.filter(item => {
      const value = item[rule.metric];
      return this.compareValue(value, rule.operator, rule.threshold_value);
    });

    return triggeredItems.length > 0 ? {
      value: triggeredItems[0][rule.metric],
      context: { 
        triggered_items: triggeredItems.map(i => i.sku),
        total_items: triggeredItems.length
      }
    } : null;
  }

  private async checkStockoutRisk(rule: AlertRule): Promise<any> {
    const { data: inventory } = await this.supabase
      .from('inventory')
      .select('*')
      .eq('company_id', rule.company_id);

    if (!inventory) return null;

    const atRiskItems = inventory.filter(item => {
      const daysRemaining = item.quantity_on_hand / (item.average_daily_usage || 1);
      return daysRemaining <= rule.threshold_value;
    });

    return atRiskItems.length > 0 ? {
      value: atRiskItems.length,
      context: {
        at_risk_skus: atRiskItems.map(i => ({
          sku: i.sku,
          days_remaining: Math.floor(i.quantity_on_hand / (i.average_daily_usage || 1))
        }))
      }
    } : null;
  }

  private async checkSupplierPerformance(rule: AlertRule): Promise<any> {
    const { data: performances } = await this.supabase
      .from('supplier_performances')
      .select('*, suppliers!inner(*)')
      .eq('suppliers.company_id', rule.company_id)
      .order('period_end', { ascending: false })
      .limit(1);

    if (!performances) return null;

    const triggered = performances.filter(perf => {
      const value = perf[rule.metric];
      return this.compareValue(value, rule.operator, rule.threshold_value);
    });

    return triggered.length > 0 ? {
      value: triggered[0][rule.metric],
      context: {
        supplier_name: triggered[0].suppliers.name,
        supplier_id: triggered[0].supplier_id
      }
    } : null;
  }

  private async checkFinancialMetric(rule: AlertRule): Promise<any> {
    // Query inventory metrics for financial calculations
    const { data: metrics } = await this.supabase
      .from('inventory_metrics')
      .select('*')
      .eq('company_id', rule.company_id)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (!metrics) return null;

    // Map metric names to actual fields
    const metricMap: Record<string, number> = {
      'total_value': metrics.total_value || 0,
      'avg_value': metrics.avg_value || 0,
      'holding_cost': metrics.holding_cost || 0,
      'turnover_ratio': metrics.turnover_ratio || 0,
      'stockout_cost': metrics.stockout_cost || 0
    };

    const value = metricMap[rule.metric] || 0;
    const triggered = this.compareValue(value, rule.operator, rule.threshold_value);

    return triggered ? {
      value,
      context: { 
        metric: rule.metric,
        calculated_at: metrics.calculated_at
      }
    } : null;
  }

  private async checkMetricThreshold(rule: AlertRule): Promise<any> {
    // Generic metric threshold check
    // Would query appropriate table based on metric
    return null;
  }

  private compareValue(value: any, operator: string, threshold: any): boolean {
    switch (operator) {
      case 'greater_than':
        return value > threshold;
      case 'less_than':
        return value < threshold;
      case 'equals':
        return value === threshold;
      case 'not_equals':
        return value !== threshold;
      case 'changes_by':
        // Would need previous value for comparison
        return false;
      default:
        return false;
    }
  }

  private async createAlert(rule: AlertRule, triggerData: any): Promise<void> {
    // Create alert instance
    const alert: Partial<AlertInstance> = {
      rule_id: rule.id,
      company_id: rule.company_id,
      title: this.generateAlertTitle(rule, triggerData),
      message: this.generateAlertMessage(rule, triggerData),
      severity: rule.severity,
      triggered_at: new Date(),
      trigger_value: triggerData.value,
      trigger_context: triggerData.context,
      status: 'active',
      notifications_sent: []
    };

    const { data: createdAlert, error } = await this.supabase
      .from('alert_instances')
      .insert(alert)
      .select()
      .single();

    if (error || !createdAlert) {
      console.error('Failed to create alert:', error);
      return;
    }

    // Send notifications
    await this.sendNotifications(createdAlert, rule.notification_channels);

    // Update rule with trigger information
    await this.supabase
      .from('alert_rules')
      .update({
        last_triggered: new Date(),
        trigger_count: rule.trigger_count + 1,
        next_eligible_trigger: rule.cooldown_minutes 
          ? new Date(Date.now() + rule.cooldown_minutes * 60000)
          : null
      })
      .eq('id', rule.id);
  }

  private generateAlertTitle(rule: AlertRule, triggerData: any): string {
    const templates: Record<AlertTriggerType, string> = {
      inventory_level: `Low Inventory Alert: ${triggerData.context?.total_items || 1} SKU(s)`,
      stockout_risk: `Stockout Risk: ${triggerData.value} items at risk`,
      supplier_performance: `Supplier Performance Alert: ${triggerData.context?.supplier_name}`,
      financial_metric: `Financial Alert: ${rule.metric}`,
      metric_threshold: `Threshold Alert: ${rule.name}`,
      order_status: `Order Status Alert`,
      system_event: `System Event: ${rule.name}`
    };

    return templates[rule.trigger_type] || rule.name;
  }

  private generateAlertMessage(rule: AlertRule, triggerData: any): string {
    let message = `Alert triggered: ${rule.metric} ${rule.operator.replace('_', ' ')} ${rule.threshold_value}`;
    message += `\nCurrent value: ${triggerData.value}`;

    if (triggerData.context) {
      if (triggerData.context.triggered_items) {
        message += `\nAffected SKUs: ${triggerData.context.triggered_items.join(', ')}`;
      }
      if (triggerData.context.at_risk_skus) {
        message += `\nAt-risk items: ${triggerData.context.at_risk_skus.length}`;
      }
    }

    return message;
  }

  private async sendNotifications(
    alert: AlertInstance, 
    channels: NotificationChannel[]
  ): Promise<void> {
    for (const channel of channels) {
      for (const recipient of channel.recipients) {
        const record: NotificationRecord = {
          channel: channel.type,
          recipient,
          sent_at: new Date(),
          status: 'pending'
        };

        try {
          await this.sendNotification(channel.type, recipient, alert);
          record.status = 'sent';
        } catch (error) {
          record.status = 'failed';
          record.error = error instanceof Error ? error.message : 'Unknown error';
        }

        // Update alert with notification record
        await this.supabase
          .from('alert_instances')
          .update({
            notifications_sent: [...alert.notifications_sent, record]
          })
          .eq('id', alert.id);
      }
    }
  }

  private async sendNotification(
    channel: string, 
    recipient: string, 
    alert: AlertInstance
  ): Promise<void> {
    switch (channel) {
      case 'email':
        // For now, send via WhatsApp with email prefix
        await this.whatsappService.sendAlertNotification({
          title: `[Email Alert] ${alert.title}`,
          message: alert.message,
          severity: alert.severity,
          recipient: recipient
        });
        break;
      
      case 'sms':
        // For now, send via WhatsApp with SMS prefix
        await this.whatsappService.sendAlertNotification({
          title: `[SMS Alert] ${alert.title}`,
          message: alert.message,
          severity: alert.severity,
          recipient: recipient
        });
        break;
      
      case 'whatsapp':
        // Send directly via WhatsApp
        await this.whatsappService.sendAlertNotification({
          title: alert.title,
          message: alert.message,
          severity: alert.severity,
          recipient: recipient
        });
        break;
      
      case 'in_app':
        // Create in-app notification
        await this.supabase
          .from('notifications')
          .insert({
            user_id: recipient,
            title: alert.title,
            message: alert.message,
            type: 'alert',
            related_id: alert.id
          });
        break;
      
      case 'webhook':
        // For now, send via WhatsApp with webhook data
        await this.whatsappService.sendNotification({
          type: 'alert',
          recipient: recipient,
          title: `[Webhook] ${alert.title}`,
          body: alert.message,
          priority: alert.severity as 'high' | 'medium' | 'low',
          data: alert.trigger_context
        });
        break;
    }
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    await this.supabase
      .from('alert_instances')
      .update({
        status: 'acknowledged',
        acknowledged_by: userId,
        acknowledged_at: new Date()
      })
      .eq('id', alertId);
  }

  async resolveAlert(alertId: string, userId: string): Promise<void> {
    await this.supabase
      .from('alert_instances')
      .update({
        status: 'resolved',
        resolved_by: userId,
        resolved_at: new Date()
      })
      .eq('id', alertId);
  }
}