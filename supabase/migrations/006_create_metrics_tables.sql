-- Create inventory_metrics table for storing calculated metrics
CREATE TABLE IF NOT EXISTS public.inventory_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    total_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
    total_units DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unique_skus INTEGER NOT NULL DEFAULT 0,
    slow_moving_count INTEGER NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_company_metrics UNIQUE (company_id, calculated_at)
);

-- Create sku_velocity table for tracking sales velocity
CREATE TABLE IF NOT EXISTS public.sku_velocity (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    units_sold DECIMAL(10, 2) NOT NULL DEFAULT 0,
    revenue DECIMAL(15, 2) NOT NULL DEFAULT 0,
    transaction_count INTEGER NOT NULL DEFAULT 0,
    velocity_score DECIMAL(5, 2) GENERATED ALWAYS AS (
        CASE WHEN transaction_count > 0 THEN units_sold / GREATEST(transaction_count, 1) ELSE 0 END
    ) STORED,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_company_sku_velocity UNIQUE (company_id, sku, calculated_at)
);

-- Create indexes for performance
CREATE INDEX idx_inventory_metrics_company_id ON public.inventory_metrics(company_id);
CREATE INDEX idx_inventory_metrics_calculated_at ON public.inventory_metrics(calculated_at DESC);

CREATE INDEX idx_sku_velocity_company_id ON public.sku_velocity(company_id);
CREATE INDEX idx_sku_velocity_sku ON public.sku_velocity(sku);
CREATE INDEX idx_sku_velocity_calculated_at ON public.sku_velocity(calculated_at DESC);

-- Enable RLS
ALTER TABLE public.inventory_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sku_velocity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for inventory_metrics
CREATE POLICY "Users can view their company's metrics" ON public.inventory_metrics
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can manage metrics" ON public.inventory_metrics
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- RLS Policies for sku_velocity
CREATE POLICY "Users can view their company's velocity data" ON public.sku_velocity
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can manage velocity data" ON public.sku_velocity
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Create a view for latest metrics
CREATE OR REPLACE VIEW public.latest_inventory_metrics AS
SELECT DISTINCT ON (company_id) 
    company_id,
    total_value,
    total_units,
    unique_skus,
    slow_moving_count,
    calculated_at
FROM public.inventory_metrics
ORDER BY company_id, calculated_at DESC;

-- Grant permissions on view
GRANT SELECT ON public.latest_inventory_metrics TO authenticated;