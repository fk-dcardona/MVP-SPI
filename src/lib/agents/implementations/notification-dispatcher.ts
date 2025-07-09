import { BaseAgent, AgentExecutionResult, NotificationDispatcherConfig } from '../types';

export class NotificationDispatcher extends BaseAgent {
  async execute(context?: any): Promise<AgentExecutionResult> {
    try {
      const config = this.agent.config as NotificationDispatcherConfig;
      
      // Get pending notifications
      const notifications = await this.getPendingNotifications();
      
      // Process each notification
      const results = await this.processNotifications(notifications, config);
      
      return {
        success: true,
        data: {
          totalNotifications: notifications.length,
          successfulSends: results.filter(r => r.success).length,
          failedSends: results.filter(r => !r.success).length,
          channels: config.channels,
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
    const config = this.agent.config as NotificationDispatcherConfig;
    const validChannels = ['email', 'sms', 'webhook', 'in-app'];
    
    if (!Array.isArray(config.channels) || config.channels.length === 0) {
      return false;
    }
    
    if (!config.channels.every(channel => validChannels.includes(channel))) {
      return false;
    }
    
    if (!config.templates || typeof config.templates !== 'object') {
      return false;
    }
    
    if (typeof config.retryAttempts !== 'number' || config.retryAttempts < 0) {
      return false;
    }
    
    return true;
  }

  private async getPendingNotifications(): Promise<any[]> {
    // TODO: Fetch pending notifications from database/queue
    
    return [
      {
        id: '1',
        type: 'order_confirmation',
        recipient: 'user@example.com',
        data: { orderId: '12345', total: 150.00 },
        channels: ['email', 'in-app']
      },
      {
        id: '2',
        type: 'inventory_alert',
        recipient: 'admin@example.com',
        data: { item: 'Product A', level: 'critical' },
        channels: ['email', 'sms']
      }
    ];
  }

  private async processNotifications(notifications: any[], config: NotificationDispatcherConfig): Promise<any[]> {
    const results = [];
    
    for (const notification of notifications) {
      const result = await this.sendNotification(notification, config);
      results.push(result);
    }
    
    return results;
  }

  private async sendNotification(notification: any, config: NotificationDispatcherConfig): Promise<any> {
    const result = {
      notificationId: notification.id,
      success: false,
      attempts: 0,
      errors: [] as string[]
    };
    
    // Filter channels based on what's enabled and what the notification supports
    const channelsToUse = config.channels.filter(
      channel => notification.channels.includes(channel)
    );
    
    for (const channel of channelsToUse) {
      let attempt = 0;
      let sent = false;
      
      while (attempt <= config.retryAttempts && !sent) {
        try {
          await this.sendViaChannel(channel, notification, config);
          sent = true;
          result.success = true;
        } catch (error) {
          attempt++;
          result.attempts = attempt;
          result.errors.push(`${channel}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          
          if (attempt <= config.retryAttempts) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, config.retryDelay * 1000));
          }
        }
      }
    }
    
    return result;
  }

  private async sendViaChannel(channel: string, notification: any, config: NotificationDispatcherConfig): Promise<void> {
    const template = config.templates[notification.type];
    
    if (!template) {
      throw new Error(`No template found for notification type: ${notification.type}`);
    }
    
    const message = this.renderTemplate(template, notification.data);
    
    switch (channel) {
      case 'email':
        await this.sendEmail(notification.recipient, message);
        break;
        
      case 'sms':
        await this.sendSMS(notification.recipient, message);
        break;
        
      case 'webhook':
        await this.sendWebhook(notification.recipient, message, notification.data);
        break;
        
      case 'in-app':
        await this.sendInApp(notification.recipient, message, notification.data);
        break;
        
      default:
        throw new Error(`Unsupported channel: ${channel}`);
    }
  }

  private renderTemplate(template: string, data: any): string {
    // Simple template rendering
    let rendered = template;
    
    for (const [key, value] of Object.entries(data)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    }
    
    return rendered;
  }

  private async sendEmail(recipient: string, message: string): Promise<void> {
    // TODO: Implement actual email sending
    console.log(`Sending email to ${recipient}: ${message}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendSMS(recipient: string, message: string): Promise<void> {
    // TODO: Implement actual SMS sending
    console.log(`Sending SMS to ${recipient}: ${message}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendWebhook(url: string, message: string, data: any): Promise<void> {
    // TODO: Implement actual webhook call
    console.log(`Calling webhook ${url} with data:`, data);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async sendInApp(userId: string, message: string, data: any): Promise<void> {
    // TODO: Implement actual in-app notification
    console.log(`Sending in-app notification to ${userId}: ${message}`);
    
    // Simulate database insert
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}