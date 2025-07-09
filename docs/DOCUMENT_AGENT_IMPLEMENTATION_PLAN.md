# Document Processing API Integration - Implementation Plan

## Executive Summary

Integrating the document processing API into the Finkargo Analytics MVP will enable extraction of structured data from unstructured trade documents. This external service complements the existing CSV data processing pipeline, creating a comprehensive data ingestion system that captures both internal (CSV) and external (document) supply chain data.

## Architecture Overview

```
┌─────────────────────┐     ┌──────────────────┐
│   Trade Documents   │     │    CSV Files     │
│  (PDF, Images, etc) │     │ (Inventory/Sales)│
└──────────┬──────────┘     └────────┬─────────┘
           │                         │
     ┌─────▼──────────┐              │
     │ Document       │              │
     │ Processing API │              │
     │ (External)     │              │
     └─────┬──────────┘              │
           │                         │
     ┌─────▼──────────────────────────┐
     │     Data Processor Agent       │
     │   (Enhanced with Doc API)      │
     └─────┬──────────────────────────┘
           │
     ┌─────▼──────────┐
     │ Unified Data   │
     │ Pipeline       │
     └─────┬──────────┘
           │
     ┌─────▼──────────┐
     │ Supply Chain   │
     │ Triangle Engine│
     └────────────────┘
```

## Key Architectural Insights

1. **Service-Oriented Architecture**: The document processing API acts as a specialized microservice
2. **Conversation-Based Processing**: Supports stateful, multi-step document extraction workflows
3. **Agent Enhancement**: Existing agents gain document processing capabilities without complexity

## Implementation Phases

### Phase 1: Document Processing Service Integration (Week 1-2)

#### 1.1 Create Document Processing Service Client
```typescript
// Location: /src/lib/services/document-processing.ts
interface DocumentProcessingService {
  // Authentication
  login(email: string, password: string): Promise<AuthToken>
  
  // Conversation Management
  createConversation(file: File): Promise<ConversationUUID>
  loadDocument(conversationId: string, documentId: string): Promise<void>
  
  // Document Processing
  processDocument(documentId: string): Promise<ProcessingResult>
  viewDocumentFields(documentId: string): Promise<ExtractedFields>
  
  // Messaging
  sendMessage(message: MessagePayload): Promise<void>
}
```

#### 1.2 Enhance Data Processor Agent
```typescript
// Location: /src/lib/agents/types/data-processor.ts
export class DataProcessorAgent extends BaseAgent {
  private documentService: DocumentProcessingService;
  
  async execute(): Promise<void> {
    // Existing CSV processing logic
    await this.processCSVFiles();
    
    // NEW: Document processing logic
    await this.processPendingDocuments();
  }
  
  private async processPendingDocuments() {
    // 1. Check for uploaded documents in queue
    // 2. Call document processing API
    // 3. Extract structured data
    // 4. Store in unified format
  }
}
```

#### 1.3 Database Schema Extension
```sql
-- Location: /supabase/migrations/005_create_documents_table.sql
CREATE TABLE trade_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  conversation_id TEXT, -- Document Processing API conversation UUID
  document_id TEXT, -- Document Processing API document UUID
  document_type TEXT NOT NULL, -- invoice, po, bol, customs
  status TEXT NOT NULL, -- pending, processing, completed, failed
  raw_file_url TEXT,
  extracted_data JSONB,
  processing_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Index for efficient queries
CREATE INDEX idx_trade_documents_status ON trade_documents(status);
CREATE INDEX idx_trade_documents_company ON trade_documents(company_id);
```

### Phase 2: Trade Document Data Mapping (Week 3-4)

#### 2.1 Document Type to Supply Chain Mapping
```typescript
// Location: /src/lib/documents/mappers/
export interface DocumentMapper<T extends TradeDocument> {
  mapToInventoryItem(doc: T): Partial<InventoryItem>
  mapToTransaction(doc: T): Partial<Transaction>
  extractSupplyChainMetrics(doc: T): SupplyChainMetrics
}

// Specific mappers for each document type
- InvoiceMapper: Maps to cost metrics, supplier performance
- PurchaseOrderMapper: Maps to service metrics, lead times
- BillOfLadingMapper: Maps to capital metrics, transit inventory
- CustomsDocumentMapper: Maps to compliance, delay risks
```

#### 2.2 Supply Chain Triangle Integration
```typescript
// Location: /src/lib/services/supply-chain-triangle.ts
interface DocumentImpactCalculator {
  calculateServiceImpact(document: ExtractedFields): ServiceScoreImpact
  calculateCostImpact(document: ExtractedFields): CostScoreImpact
  calculateCapitalImpact(document: ExtractedFields): CapitalScoreImpact
}
```

### Phase 3: Real-time Document Processing Pipeline (Week 5-6)

#### 3.1 Document Upload Interface
```typescript
// Location: /src/app/dashboard/documents/upload/page.tsx
- Drag-and-drop interface for trade documents
- Support for PDF, images, and common formats
- Real-time processing status
- Preview of extracted data before confirmation
```

#### 3.2 WhatsApp Document Pipeline
```typescript
// Extend existing WhatsApp service
// Location: /src/lib/services/whatsapp.ts
interface WhatsAppDocumentHandler {
  async handleIncomingDocument(mediaUrl: string, phoneNumber: string) {
    // 1. Download document from WhatsApp media URL
    // 2. Create conversation in document API
    // 3. Process document
    // 4. Send extraction summary back via WhatsApp
  }
}
```

#### 3.3 Conversation Flow Management
```typescript
// Location: /src/lib/services/conversation-manager.ts
export class ConversationManager {
  // Manages stateful conversations with document API
  // Handles multi-document workflows
  // Maintains context across related documents
}
```

## Integration Points

### 1. Environment Configuration
```env
# Document Processing API
DOCUMENT_API_URL=https://63cbfc991dab.ngrok-free.app
DOCUMENT_API_EMAIL=your_email@example.com
DOCUMENT_API_PASSWORD=your_password
DOCUMENT_API_COMPANY_KEY=your_company_key
DOCUMENT_API_PHONE_KEY=your_phone_key
```

### 2. API Routes
```typescript
// /src/app/api/documents/
- POST /upload - Upload document and create conversation
- GET /[id]/status - Check processing status
- GET /[id]/fields - Get extracted fields
- POST /[id]/confirm - Confirm and integrate extracted data
- GET /conversations/[id] - Get conversation history
```

### 3. Agent Configuration
```typescript
// Update agent factory configuration
// Location: /src/lib/agents/agent-factory.ts
{
  type: 'data-processor',
  config: {
    // Existing CSV config
    csvProcessing: { ... },
    
    // NEW: Document processing config
    documentProcessing: {
      enabled: true,
      apiUrl: process.env.DOCUMENT_API_URL,
      batchSize: 10,
      retryAttempts: 3
    }
  }
}
```

## Data Flow Architecture

```typescript
// 1. Document arrives (upload or WhatsApp)
// 2. Create conversation in document API
// 3. Process document and extract fields
// 4. Map extracted fields to supply chain data model
// 5. Calculate impact on Supply Chain Triangle
// 6. Store in database with relationships
// 7. Trigger real-time updates to dashboard
```

## Success Metrics

1. **Processing Accuracy**: > 95% field extraction accuracy
2. **Processing Speed**: < 15 seconds per document
3. **Integration Seamless**: Zero disruption to CSV pipeline
4. **User Adoption**: 50% of documents processed automatically

## Security Considerations

1. **API Authentication**: Secure token management
2. **Document Storage**: Encrypted at rest
3. **Access Control**: Company-based isolation
4. **Audit Trail**: Complete processing history

## Error Handling Strategy

```typescript
interface DocumentProcessingError {
  type: 'auth' | 'network' | 'parsing' | 'validation'
  retry: boolean
  userMessage: string
  technicalDetails: any
}

// Graceful degradation
// Queue failed documents for manual review
// Alert users via WhatsApp for critical failures
```

## Next Steps

1. Obtain API credentials for document processing service
2. Implement service client with proper error handling
3. Enhance data processor agent with document capabilities
4. Create document upload UI
5. Test with sample trade documents
6. Deploy to staging environment

This integration transforms the Supply Chain Intelligence Platform into a comprehensive data hub that seamlessly processes both structured (CSV) and unstructured (documents) supply chain data, providing real-time insights through the Supply Chain Triangle framework.