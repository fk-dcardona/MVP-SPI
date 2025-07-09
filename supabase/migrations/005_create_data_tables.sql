-- Create data_uploads table for tracking file uploads
CREATE TABLE IF NOT EXISTS public.data_uploads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('inventory', 'sales')),
    row_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Create inventory_items table
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    upload_id UUID REFERENCES public.data_uploads(id) ON DELETE SET NULL,
    sku TEXT NOT NULL,
    description TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_value DECIMAL(10, 2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_company_sku UNIQUE (company_id, sku),
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Create sales_transactions table
CREATE TABLE IF NOT EXISTS public.sales_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    upload_id UUID REFERENCES public.data_uploads(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    sku TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    revenue DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) GENERATED ALWAYS AS (
        CASE WHEN quantity > 0 THEN revenue / quantity ELSE 0 END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT fk_company FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_data_uploads_company_id ON public.data_uploads(company_id);
CREATE INDEX idx_data_uploads_user_id ON public.data_uploads(user_id);
CREATE INDEX idx_data_uploads_status ON public.data_uploads(status);
CREATE INDEX idx_data_uploads_uploaded_at ON public.data_uploads(uploaded_at DESC);

CREATE INDEX idx_inventory_items_company_id ON public.inventory_items(company_id);
CREATE INDEX idx_inventory_items_sku ON public.inventory_items(sku);
CREATE INDEX idx_inventory_items_upload_id ON public.inventory_items(upload_id);

CREATE INDEX idx_sales_transactions_company_id ON public.sales_transactions(company_id);
CREATE INDEX idx_sales_transactions_sku ON public.sales_transactions(sku);
CREATE INDEX idx_sales_transactions_date ON public.sales_transactions(date);
CREATE INDEX idx_sales_transactions_upload_id ON public.sales_transactions(upload_id);

-- Enable RLS
ALTER TABLE public.data_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for data_uploads
CREATE POLICY "Users can view their company's uploads" ON public.data_uploads
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create uploads for their company" ON public.data_uploads
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their company's uploads" ON public.data_uploads
    FOR UPDATE USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for inventory_items
CREATE POLICY "Users can view their company's inventory" ON public.inventory_items
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their company's inventory" ON public.inventory_items
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- RLS Policies for sales_transactions
CREATE POLICY "Users can view their company's sales" ON public.sales_transactions
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their company's sales" ON public.sales_transactions
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

-- Create views for analytics
CREATE OR REPLACE VIEW public.inventory_summary AS
SELECT 
    company_id,
    COUNT(DISTINCT sku) as total_skus,
    SUM(quantity) as total_units,
    SUM(total_value) as total_inventory_value,
    AVG(unit_cost) as avg_unit_cost,
    MAX(last_updated) as last_updated
FROM public.inventory_items
GROUP BY company_id;

CREATE OR REPLACE VIEW public.sales_summary AS
SELECT 
    company_id,
    date_trunc('month', date) as month,
    COUNT(DISTINCT sku) as skus_sold,
    SUM(quantity) as total_units_sold,
    SUM(revenue) as total_revenue,
    AVG(unit_price) as avg_selling_price
FROM public.sales_transactions
GROUP BY company_id, date_trunc('month', date);

-- Grant permissions on views
GRANT SELECT ON public.inventory_summary TO authenticated;
GRANT SELECT ON public.sales_summary TO authenticated;