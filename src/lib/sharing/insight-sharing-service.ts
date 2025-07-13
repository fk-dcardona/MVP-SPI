/**
 * Insight Sharing Service
 * Enables viral network effects through shareable insights
 */

import { DashboardMetrics, ProductInsight } from '@/lib/calculations/immediate-value-engine'

export interface ShareableInsight {
  id: string
  type: 'product' | 'supplier' | 'financial' | 'inventory' | 'full-report'
  title: string
  description: string
  metrics: Record<string, any>
  createdAt: string
  expiresAt?: string
  companyName?: string
  sharedBy?: string
  accessCount: number
  permissions: SharePermissions
}

export interface SharePermissions {
  canView: boolean
  canComment: boolean
  canDownload: boolean
  requiresAuth: boolean
  allowedEmails?: string[]
  password?: string
}

export interface ShareLink {
  url: string
  shortCode: string
  qrCode?: string
  expiresAt?: string
}

export class InsightSharingService {
  private baseUrl: string
  
  constructor(baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || '') {
    this.baseUrl = baseUrl
  }
  
  /**
   * Create a shareable link for specific insights
   */
  async createShareableInsight(
    type: ShareableInsight['type'],
    data: any,
    options: Partial<SharePermissions> = {}
  ): Promise<ShareLink> {
    const insight: ShareableInsight = {
      id: this.generateId(),
      type,
      title: this.generateTitle(type, data),
      description: this.generateDescription(type, data),
      metrics: this.extractMetrics(type, data),
      createdAt: new Date().toISOString(),
      accessCount: 0,
      permissions: {
        canView: true,
        canComment: false,
        canDownload: false,
        requiresAuth: false,
        ...options
      }
    }
    
    // In production, this would save to database
    const shortCode = this.generateShortCode()
    const shareLink: ShareLink = {
      url: `${this.baseUrl}/share/${shortCode}`,
      shortCode,
      expiresAt: insight.expiresAt
    }
    
    // Generate QR code for easy mobile sharing
    shareLink.qrCode = await this.generateQRCode(shareLink.url)
    
    return shareLink
  }
  
  /**
   * Create shareable supplier scorecard
   */
  async createSupplierScorecard(
    supplierName: string,
    metrics: {
      onTimeDelivery: number
      qualityScore: number
      priceCompetitiveness: number
      responseTime: number
      overallRating: number
    }
  ): Promise<ShareLink> {
    const data = {
      supplierName,
      metrics,
      benchmarks: this.getIndustryBenchmarks(),
      recommendations: this.generateSupplierRecommendations(metrics)
    }
    
    return this.createShareableInsight('supplier', data, {
      canComment: true,
      canDownload: true
    })
  }
  
  /**
   * Create shareable product performance report
   */
  async createProductReport(
    product: ProductInsight,
    historicalData?: any[]
  ): Promise<ShareLink> {
    const data = {
      product,
      historicalData,
      insights: this.generateProductInsights(product),
      recommendations: this.generateProductRecommendations(product)
    }
    
    return this.createShareableInsight('product', data)
  }
  
  /**
   * Create full dashboard share
   */
  async createDashboardShare(
    metrics: DashboardMetrics,
    insights: ProductInsight[],
    options?: {
      includeDetails: boolean
      password?: string
      expiresIn?: number // hours
    }
  ): Promise<ShareLink> {
    const data = {
      metrics,
      insights: options?.includeDetails ? insights : insights.slice(0, 10),
      summary: this.generateExecutiveSummary(metrics),
      generatedAt: new Date().toISOString()
    }
    
    const expiresAt = options?.expiresIn 
      ? new Date(Date.now() + options.expiresIn * 60 * 60 * 1000).toISOString()
      : undefined
    
    return this.createShareableInsight('full-report', data, {
      canDownload: true,
      password: options?.password,
      requiresAuth: !!options?.password
    })
  }
  
  /**
   * Generate WhatsApp shareable message
   */
  generateWhatsAppMessage(insight: ShareableInsight, link: ShareLink): string {
    const lines = [
      `📊 *${insight.title}*`,
      '',
      insight.description,
      '',
      '🔍 *Key Metrics:*'
    ]
    
    // Add top 3 metrics
    Object.entries(insight.metrics)
      .slice(0, 3)
      .forEach(([key, value]) => {
        lines.push(`• ${this.formatMetricName(key)}: ${this.formatMetricValue(value)}`)
      })
    
    lines.push('', `🔗 View full report: ${link.url}`)
    
    return encodeURIComponent(lines.join('\n'))
  }
  
  /**
   * Generate email shareable content
   */
  generateEmailContent(insight: ShareableInsight, link: ShareLink): {
    subject: string
    body: string
    html: string
  } {
    const subject = `Supply Chain Insight: ${insight.title}`
    
    const body = `
${insight.title}

${insight.description}

Key Metrics:
${Object.entries(insight.metrics)
  .map(([key, value]) => `- ${this.formatMetricName(key)}: ${this.formatMetricValue(value)}`)
  .join('\n')}

View the full interactive report: ${link.url}

${link.expiresAt ? `This link expires on ${new Date(link.expiresAt).toLocaleDateString()}` : ''}
    `.trim()
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .metrics { background: #e9ecef; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .metric-item { margin: 10px 0; }
    .cta { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 20px 0; }
    .footer { color: #6c757d; font-size: 14px; margin-top: 30px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${insight.title}</h2>
      <p>${insight.description}</p>
    </div>
    
    <div class="metrics">
      <h3>Key Metrics:</h3>
      ${Object.entries(insight.metrics)
        .map(([key, value]) => `
          <div class="metric-item">
            <strong>${this.formatMetricName(key)}:</strong> ${this.formatMetricValue(value)}
          </div>
        `)
        .join('')}
    </div>
    
    <a href="${link.url}" class="cta">View Full Interactive Report</a>
    
    <div class="footer">
      ${link.expiresAt ? `<p>This link expires on ${new Date(link.expiresAt).toLocaleDateString()}</p>` : ''}
      <p>Powered by Finkargo Analytics - Supply Chain Intelligence Platform</p>
    </div>
  </div>
</body>
</html>
    `
    
    return { subject, body, html }
  }
  
  /**
   * Track share analytics
   */
  async trackShareAccess(shortCode: string, metadata?: {
    referrer?: string
    userAgent?: string
    location?: string
  }): Promise<void> {
    // In production, this would log to analytics database
    console.log('Share accessed:', { shortCode, metadata })
  }
  
  // Private helper methods
  
  private generateId(): string {
    return `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateShortCode(): string {
    return Math.random().toString(36).substr(2, 8)
  }
  
  private generateTitle(type: ShareableInsight['type'], data: any): string {
    switch (type) {
      case 'product':
        return `Product Performance: ${data.product?.sku || 'Overview'}`
      case 'supplier':
        return `Supplier Scorecard: ${data.supplierName || 'Analysis'}`
      case 'financial':
        return 'Financial Health Report'
      case 'inventory':
        return 'Inventory Optimization Report'
      case 'full-report':
        return 'Supply Chain Intelligence Dashboard'
      default:
        return 'Supply Chain Insight'
    }
  }
  
  private generateDescription(type: ShareableInsight['type'], data: any): string {
    switch (type) {
      case 'product':
        return `Performance analysis and recommendations for ${data.product?.description || 'product'}`
      case 'supplier':
        return `Comprehensive performance evaluation for ${data.supplierName || 'supplier'}`
      case 'financial':
        return 'Working capital and cash flow optimization insights'
      case 'inventory':
        return 'Stock levels, turnover rates, and optimization opportunities'
      case 'full-report':
        return 'Complete supply chain performance analysis with actionable insights'
      default:
        return 'Supply chain performance insights and recommendations'
    }
  }
  
  private extractMetrics(type: ShareableInsight['type'], data: any): Record<string, any> {
    // Extract relevant metrics based on type
    switch (type) {
      case 'product':
        return {
          roi: data.product?.roi,
          inventoryTurnover: data.product?.inventoryTurnover,
          stockCoverage: data.product?.stockCoverage,
          marginPerUnit: data.product?.marginPerUnit
        }
      case 'supplier':
        return data.metrics || {}
      case 'full-report':
        return {
          totalInventoryValue: data.metrics?.totalInventoryValue,
          totalRevenue: data.metrics?.totalRevenue,
          avgInventoryTurnover: data.metrics?.avgInventoryTurnover,
          alertCount: (data.metrics?.lowStockCount || 0) + (data.metrics?.overstockCount || 0)
        }
      default:
        return {}
    }
  }
  
  private async generateQRCode(url: string): Promise<string> {
    // In production, use a QR code library
    // For now, return a placeholder
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
  }
  
  private formatMetricName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }
  
  private formatMetricValue(value: any): string {
    if (typeof value === 'number') {
      if (value > 1000000) return `$${(value / 1000000).toFixed(1)}M`
      if (value > 1000) return `$${(value / 1000).toFixed(1)}K`
      if (value < 100 && value % 1 !== 0) return value.toFixed(2)
      return value.toString()
    }
    return String(value)
  }
  
  private getIndustryBenchmarks(): any {
    // Placeholder for industry benchmark data
    return {
      onTimeDelivery: 95,
      qualityScore: 90,
      priceCompetitiveness: 85,
      responseTime: 24 // hours
    }
  }
  
  private generateSupplierRecommendations(metrics: any): string[] {
    const recommendations = []
    
    if (metrics.onTimeDelivery < 90) {
      recommendations.push('Improve delivery performance to meet industry standards')
    }
    if (metrics.qualityScore < 85) {
      recommendations.push('Implement quality improvement program')
    }
    if (metrics.responseTime > 48) {
      recommendations.push('Enhance communication response times')
    }
    
    return recommendations
  }
  
  private generateProductInsights(product: ProductInsight): string[] {
    const insights = []
    
    if (product.isLowStock) {
      insights.push(`Low stock alert: Only ${product.stockCoverage.toFixed(0)} days of coverage remaining`)
    }
    if (product.isFastMoving) {
      insights.push(`Fast-moving item with ${product.inventoryTurnover.toFixed(1)}x annual turnover`)
    }
    if (product.roi > 50) {
      insights.push(`High-margin product with ${product.roi.toFixed(1)}% ROI`)
    }
    
    return insights
  }
  
  private generateProductRecommendations(product: ProductInsight): string[] {
    const recommendations = []
    
    if (product.isLowStock && product.roi > 30) {
      recommendations.push('Increase stock levels to capture demand')
    }
    if (product.isOverstock && product.roi < 20) {
      recommendations.push('Consider promotional pricing to reduce inventory')
    }
    if (product.isFastMoving && product.marginPerUnit > 0) {
      recommendations.push('Negotiate volume discounts with suppliers')
    }
    
    return recommendations
  }
  
  private generateExecutiveSummary(metrics: DashboardMetrics): string {
    return `
      Total inventory value of ${this.formatMetricValue(metrics.totalInventoryValue)} 
      with ${metrics.totalProducts} products generating ${this.formatMetricValue(metrics.totalRevenue)} 
      in revenue. Average inventory turnover is ${metrics.avgInventoryTurnover.toFixed(1)}x per year. 
      ${metrics.lowStockCount} items require immediate reordering, while 
      ${this.formatMetricValue(metrics.opportunityCost)} is tied up in slow-moving inventory.
    `.trim().replace(/\s+/g, ' ')
  }
}