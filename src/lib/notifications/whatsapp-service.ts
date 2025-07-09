import twilio from 'twilio';

export interface WhatsAppMessage {
  to: string;
  body: string;
  mediaUrl?: string;
  templateSid?: string;
  templateData?: Record<string, any>;
}

export interface WhatsAppNotification {
  type: 'alert' | 'report' | 'reminder' | 'update';
  recipient: string;
  title: string;
  body: string;
  priority: 'high' | 'medium' | 'low';
  data?: Record<string, any>;
}

export class WhatsAppService {
  private client: twilio.Twilio;
  private fromNumber: string;
  private messagingServiceSid?: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }

    this.client = twilio(accountSid, authToken);
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'; // Twilio sandbox default
    this.messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;
  }

  async sendMessage(message: WhatsAppMessage): Promise<string> {
    try {
      const messageOptions: any = {
        from: this.fromNumber,
        to: `whatsapp:${message.to}`,
        body: message.body
      };

      if (message.mediaUrl) {
        messageOptions.mediaUrl = [message.mediaUrl];
      }

      if (this.messagingServiceSid) {
        messageOptions.messagingServiceSid = this.messagingServiceSid;
        delete messageOptions.from;
      }

      const response = await this.client.messages.create(messageOptions);
      return response.sid;
    } catch (error) {
      console.error('Failed to send WhatsApp message:', error);
      throw error;
    }
  }

  async sendNotification(notification: WhatsAppNotification): Promise<string> {
    const formattedBody = this.formatNotificationBody(notification);
    
    return await this.sendMessage({
      to: notification.recipient,
      body: formattedBody
    });
  }

  async sendAlertNotification(alert: {
    title: string;
    message: string;
    severity: string;
    recipient: string;
  }): Promise<string> {
    const emoji = this.getSeverityEmoji(alert.severity);
    
    const body = `${emoji} *${alert.title}*\n\n${alert.message}\n\n_Severity: ${alert.severity}_\n\nReply with:\n• ACK to acknowledge\n• RESOLVE to mark as resolved\n• INFO for more details`;
    
    return await this.sendMessage({
      to: alert.recipient,
      body
    });
  }

  async sendDailyDigest(digest: {
    recipient: string;
    date: Date;
    metrics: {
      activeAlerts: number;
      inventoryValue: number;
      cashPosition: number;
      pendingOrders: number;
    };
    criticalItems: Array<{ sku: string; issue: string }>;
  }): Promise<string> {
    const dateStr = digest.date.toLocaleDateString();
    
    let body = `📊 *Daily Supply Chain Digest*\n_${dateStr}_\n\n`;
    
    body += `*Key Metrics:*\n`;
    body += `• Active Alerts: ${digest.metrics.activeAlerts}\n`;
    body += `• Inventory Value: $${digest.metrics.inventoryValue.toLocaleString()}\n`;
    body += `• Cash Position: $${digest.metrics.cashPosition.toLocaleString()}\n`;
    body += `• Pending Orders: ${digest.metrics.pendingOrders}\n\n`;
    
    if (digest.criticalItems.length > 0) {
      body += `⚠️ *Critical Items:*\n`;
      digest.criticalItems.forEach(item => {
        body += `• ${item.sku}: ${item.issue}\n`;
      });
      body += '\n';
    }
    
    body += `View full dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
    
    return await this.sendMessage({
      to: digest.recipient,
      body
    });
  }

  async sendReorderNotification(reorder: {
    recipient: string;
    sku: string;
    productName: string;
    currentStock: number;
    reorderPoint: number;
    recommendedQuantity: number;
    supplier: string;
  }): Promise<string> {
    const body = `📦 *Reorder Alert*\n\n*${reorder.productName}* (${reorder.sku})\n\nCurrent Stock: ${reorder.currentStock} units\nReorder Point: ${reorder.reorderPoint} units\n\n*Recommended Action:*\nOrder ${reorder.recommendedQuantity} units from ${reorder.supplier}\n\nReply:\n• ORDER to create purchase order\n• DEFER to postpone\n• ADJUST [quantity] to change order amount`;
    
    return await this.sendMessage({
      to: reorder.recipient,
      body
    });
  }

  async sendSupplierAlert(alert: {
    recipient: string;
    supplierName: string;
    performanceScore: number;
    issues: string[];
    recommendation: string;
  }): Promise<string> {
    const emoji = alert.performanceScore < 50 ? '🚨' : alert.performanceScore < 70 ? '⚠️' : '📉';
    
    let body = `${emoji} *Supplier Performance Alert*\n\n*${alert.supplierName}*\nScore: ${alert.performanceScore}/100\n\n`;
    
    if (alert.issues.length > 0) {
      body += `*Issues Detected:*\n`;
      alert.issues.forEach(issue => {
        body += `• ${issue}\n`;
      });
      body += '\n';
    }
    
    body += `*Recommendation:*\n${alert.recommendation}\n\n`;
    body += `Reply SUPPLIER ${alert.supplierName} for detailed report`;
    
    return await this.sendMessage({
      to: alert.recipient,
      body
    });
  }

  async handleIncomingMessage(from: string, body: string): Promise<string> {
    const normalizedBody = body.trim().toUpperCase();
    
    // Handle acknowledgments
    if (normalizedBody === 'ACK' || normalizedBody === 'ACKNOWLEDGE') {
      return 'Alert acknowledged. Our team will review shortly.';
    }
    
    // Handle resolutions
    if (normalizedBody === 'RESOLVE' || normalizedBody === 'RESOLVED') {
      return 'Alert marked as resolved. Thank you for the update.';
    }
    
    // Handle info requests
    if (normalizedBody === 'INFO' || normalizedBody === 'MORE') {
      return 'For detailed information, please visit your dashboard or reply with a specific question.';
    }
    
    // Handle order confirmations
    if (normalizedBody === 'ORDER') {
      return 'Purchase order request received. Our procurement team will process this shortly.';
    }
    
    // Handle adjustments
    if (normalizedBody.startsWith('ADJUST')) {
      const quantity = normalizedBody.match(/\d+/);
      if (quantity) {
        return `Order quantity adjusted to ${quantity[0]} units. Reply ORDER to confirm.`;
      }
    }
    
    // Handle supplier queries
    if (normalizedBody.startsWith('SUPPLIER')) {
      return 'Supplier report request received. Generating detailed analysis...';
    }
    
    // Default response
    return 'Thank you for your message. Available commands: ACK, RESOLVE, INFO, ORDER, ADJUST [quantity], SUPPLIER [name]';
  }

  private formatNotificationBody(notification: WhatsAppNotification): string {
    const emoji = this.getNotificationEmoji(notification.type);
    const priority = notification.priority === 'high' ? '🔴' : notification.priority === 'medium' ? '🟡' : '🟢';
    
    let body = `${emoji} *${notification.title}*\n\n${notification.body}\n\n${priority} Priority: ${notification.priority}`;
    
    if (notification.data) {
      body += '\n\n*Details:*\n';
      Object.entries(notification.data).forEach(([key, value]) => {
        body += `• ${this.formatKey(key)}: ${value}\n`;
      });
    }
    
    return body;
  }

  private getNotificationEmoji(type: string): string {
    const emojis: Record<string, string> = {
      alert: '🚨',
      report: '📊',
      reminder: '⏰',
      update: '📢'
    };
    return emojis[type] || '📌';
  }

  private getSeverityEmoji(severity: string): string {
    const emojis: Record<string, string> = {
      critical: '🚨',
      high: '⚠️',
      medium: '🔔',
      low: '💡'
    };
    return emojis[severity] || '📌';
  }

  private formatKey(key: string): string {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Utility to verify if a number is opted in for WhatsApp
  async verifyOptIn(phoneNumber: string): Promise<boolean> {
    try {
      // In production, you would check against your opt-in database
      // For now, return true for testing
      return true;
    } catch (error) {
      console.error('Failed to verify opt-in status:', error);
      return false;
    }
  }

  // Send opt-in request via SMS
  async sendOptInRequest(phoneNumber: string): Promise<void> {
    try {
      await this.client.messages.create({
        to: phoneNumber,
        from: process.env.TWILIO_SMS_NUMBER!,
        body: 'Reply YES to receive supply chain alerts via WhatsApp. Reply STOP to opt out at any time.'
      });
    } catch (error) {
      console.error('Failed to send opt-in request:', error);
      throw error;
    }
  }
}