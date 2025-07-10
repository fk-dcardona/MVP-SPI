import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { DocumentProcessingService, DocumentDataMapper } from '@/lib/services/document-processing';

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();
    
    if (!profile?.company_id) {
      return NextResponse.json({ error: 'No company found' }, { status: 400 });
    }
    
    // Get the file from form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Initialize document processing service
    const docService = new DocumentProcessingService();
    
    // Authenticate with document API
    const email = process.env.DOCUMENT_API_EMAIL;
    const password = process.env.DOCUMENT_API_PASSWORD;
    
    if (!email || !password) {
      // If no document API credentials, fall back to storing raw document
      console.warn('Document API credentials not configured');
      return NextResponse.json({
        message: 'Document stored for manual processing',
        requiresManualProcessing: true
      });
    }
    
    try {
      await docService.login(email, password);
      
      // Create conversation and process document
      const conversationId = await docService.createConversation(file);
      const extractedFields = await docService.processDocument(conversationId);
      
      // Detect document type
      const documentType = DocumentDataMapper.detectDocumentType(extractedFields);
      
      // Process based on document type
      let processedCount = 0;
      
      if (documentType === 'invoice' || documentType === 'purchase_order') {
        // Map to inventory items
        const inventoryItems = DocumentDataMapper.mapToInventoryItem(extractedFields);
        
        if (Array.isArray(inventoryItems)) {
          for (const item of inventoryItems) {
          const { error } = await supabase
            .from('inventory_items')
            .upsert({
              ...item,
              company_id: profile.company_id
            }, {
              onConflict: 'company_id,sku'
            });
          
          if (!error) processedCount++;
          }
        }
        
        // Also create sales transaction if invoice
        if (documentType === 'invoice') {
          const transaction = DocumentDataMapper.mapToSalesTransaction(extractedFields);
          await supabase
            .from('sales_transactions')
            .insert({
              ...transaction,
              company_id: profile.company_id
            });
        }
      }
      
      // Store document record
      await supabase
        .from('processed_documents')
        .insert({
          company_id: profile.company_id,
          document_type: documentType,
          conversation_id: conversationId,
          extracted_fields: extractedFields,
          file_name: file.name,
          processed_at: new Date(),
          status: 'completed'
        });
      
      return NextResponse.json({
        success: true,
        documentType,
        itemsProcessed: processedCount,
        extractedFields
      });
      
    } catch (apiError) {
      console.error('Document API error:', apiError);
      
      // Store for manual processing
      await supabase
        .from('processed_documents')
        .insert({
          company_id: profile.company_id,
          document_type: 'unknown',
          file_name: file.name,
          status: 'pending',
          error: apiError instanceof Error ? apiError.message : 'Processing failed'
        });
      
      return NextResponse.json({
        message: 'Document stored for manual processing',
        requiresManualProcessing: true,
        error: apiError instanceof Error ? apiError.message : 'Processing failed'
      });
    }
    
  } catch (error) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}