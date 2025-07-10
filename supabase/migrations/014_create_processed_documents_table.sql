-- Create processed_documents table to track document processing
CREATE TABLE IF NOT EXISTS public.processed_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    document_type VARCHAR(50) CHECK (document_type IN ('invoice', 'purchase_order', 'bill_of_lading', 'customs', 'unknown')),
    conversation_id TEXT,
    file_name TEXT NOT NULL,
    extracted_fields JSONB,
    status VARCHAR(20) CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.processed_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their company's documents" ON public.processed_documents
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert documents for their company" ON public.processed_documents
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Create index for performance
CREATE INDEX idx_processed_documents_company_id ON public.processed_documents(company_id);
CREATE INDEX idx_processed_documents_status ON public.processed_documents(status);
CREATE INDEX idx_processed_documents_created_at ON public.processed_documents(created_at DESC);