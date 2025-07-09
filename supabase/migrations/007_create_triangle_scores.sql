-- Create triangle_scores table for storing Supply Chain Triangle calculations
CREATE TABLE IF NOT EXISTS public.triangle_scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    service_score DECIMAL(5, 2) NOT NULL CHECK (service_score >= 0 AND service_score <= 100),
    cost_score DECIMAL(5, 2) NOT NULL CHECK (cost_score >= 0 AND cost_score <= 100),
    capital_score DECIMAL(5, 2) NOT NULL CHECK (capital_score >= 0 AND capital_score <= 100),
    overall_score DECIMAL(5, 2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_triangle_scores_company_timestamp ON public.triangle_scores(company_id, timestamp DESC);
CREATE INDEX idx_triangle_scores_timestamp ON public.triangle_scores(timestamp DESC);

-- Enable RLS
ALTER TABLE public.triangle_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their company's triangle scores" ON public.triangle_scores
    FOR SELECT TO authenticated
    USING (company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "System can insert triangle scores" ON public.triangle_scores
    FOR INSERT TO authenticated
    WITH CHECK (company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ));

-- Create SKU velocity table for tracking sales performance
CREATE TABLE IF NOT EXISTS public.sku_velocity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    units_sold DECIMAL(10, 2) NOT NULL DEFAULT 0,
    revenue DECIMAL(12, 2) NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_company_sku_velocity UNIQUE (company_id, sku, calculated_at)
);

-- Create indexes
CREATE INDEX idx_sku_velocity_company_sku ON public.sku_velocity(company_id, sku);
CREATE INDEX idx_sku_velocity_calculated ON public.sku_velocity(calculated_at DESC);

-- Enable RLS
ALTER TABLE public.sku_velocity ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their company's SKU velocity" ON public.sku_velocity
    FOR SELECT TO authenticated
    USING (company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ));

CREATE POLICY "System can insert SKU velocity" ON public.sku_velocity
    FOR INSERT TO authenticated
    WITH CHECK (company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ));

-- Add fulfilled column to sales_transactions if not exists
ALTER TABLE public.sales_transactions 
ADD COLUMN IF NOT EXISTS fulfilled BOOLEAN DEFAULT true;

-- Add financial metrics columns to inventory_metrics if not exist
ALTER TABLE public.inventory_metrics
ADD COLUMN IF NOT EXISTS accounts_receivable DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS accounts_payable DECIMAL(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS days_sales_outstanding INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS days_payable_outstanding INTEGER DEFAULT 45;

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_triangle_scores_updated_at
    BEFORE UPDATE ON public.triangle_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sku_velocity_updated_at
    BEFORE UPDATE ON public.sku_velocity
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();