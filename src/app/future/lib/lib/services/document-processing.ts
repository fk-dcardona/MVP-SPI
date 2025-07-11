interface AuthToken {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface ExtractedFields {
  invoice_number?: string;
  invoice_date?: string;
  supplier_name?: string;
  customer_name?: string;
  total_amount?: number;
  currency?: string;
  line_items?: Array<{
    sku?: string;
    description?: string;
    quantity?: number;
    unit_price?: number;
    total?: number;
  }>;
  shipping_details?: {
    address?: string;
    method?: string;
    tracking_number?: string;
  };
  [key: string]: any;
}

export class DocumentProcessingService {
  private baseUrl: string;
  private authToken?: AuthToken;
  
  constructor() {
    this.baseUrl = process.env.DOCUMENT_API_URL || 'https://63cbfc991dab.ngrok-free.app';
  }
  
  async login(email: string, password: string): Promise<AuthToken> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.statusText}`);
    }
    
    this.authToken = await response.json();
    return this.authToken;
  }
  
  async createConversation(file: File): Promise<string> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${this.baseUrl}/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken.access_token}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create conversation: ${response.statusText}`);
    }
    
    const result = await response.json();
    return result.conversation_id;
  }
  
  async processDocument(conversationId: string): Promise<ExtractedFields> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/process`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to process document: ${response.statusText}`);
    }
    
    return await response.json();
  }
  
  async sendMessage(conversationId: string, message: string): Promise<any> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }
    
    const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.authToken.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }
    
    return await response.json();
  }
}

// Mapper to convert extracted fields to our database schema
export class DocumentDataMapper {
  static mapToInventoryItem(fields: ExtractedFields): Partial<any>[] {
    const items = fields.line_items || [];
    
    return items.map(item => ({
      sku: item.sku || `SKU-${Date.now()}`,
      product_name: item.description || 'Unknown Product',
      quantity_on_hand: item.quantity || 0,
      unit_cost: item.unit_price || 0,
      supplier_name: fields.supplier_name,
      last_updated: new Date()
    }));
  }
  
  static mapToSalesTransaction(fields: ExtractedFields): Partial<any> {
    return {
      transaction_date: fields.invoice_date ? new Date(fields.invoice_date) : new Date(),
      customer_name: fields.customer_name || 'Unknown Customer',
      total_amount: fields.total_amount || 0,
      currency: fields.currency || 'USD',
      invoice_number: fields.invoice_number,
      status: 'completed',
      line_items: fields.line_items || []
    };
  }
  
  static detectDocumentType(fields: ExtractedFields): 'invoice' | 'purchase_order' | 'bill_of_lading' | 'unknown' {
    if (fields.invoice_number && fields.invoice_date) {
      return 'invoice';
    }
    if (fields.po_number || fields.purchase_order_number) {
      return 'purchase_order';
    }
    if (fields.bol_number || fields.shipping_details?.tracking_number) {
      return 'bill_of_lading';
    }
    return 'unknown';
  }
}