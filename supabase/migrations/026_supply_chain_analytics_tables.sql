-- Create suppliers table for supplier management and analytics
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    contact_name TEXT,
    contact_email TEXT,
    contact_phone TEXT,
    address TEXT,
    payment_terms TEXT,
    lead_time_days INTEGER NOT NULL DEFAULT 7,
    minimum_order_value DECIMAL(10, 2),
    performance_score DECIMAL(5, 2),
    delivery_reliability DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, code)
);

-- Create purchase orders table for tracking supplier orders
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES suppliers(id),
    order_number TEXT NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE NOT NULL,
    actual_delivery_date DATE,
    status TEXT CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending',
    total_amount DECIMAL(15, 2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    shipping_cost DECIMAL(10, 2),
    delivery_method TEXT,
    tracking_number TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, order_number)
);

-- Create purchase order items table
CREATE TABLE purchase_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create financial metrics table for advanced financial analytics
CREATE TABLE financial_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Working Capital Metrics
    inventory_value DECIMAL(15, 2),
    accounts_receivable DECIMAL(15, 2),
    accounts_payable DECIMAL(15, 2),
    working_capital DECIMAL(15, 2),
    
    -- Cash Conversion Cycle
    days_inventory_outstanding INTEGER,
    days_sales_outstanding INTEGER,
    days_payable_outstanding INTEGER,
    cash_conversion_cycle INTEGER,
    
    -- Profitability Metrics
    gross_margin DECIMAL(5, 4),
    operating_margin DECIMAL(5, 4),
    net_margin DECIMAL(5, 4),
    
    -- Activity Ratios
    inventory_turnover DECIMAL(5, 2),
    receivables_turnover DECIMAL(5, 2),
    payables_turnover DECIMAL(5, 2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, period_start, period_end)
);

-- Create analytics metrics table for storing calculated metrics
CREATE TABLE analytics_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    metric_type TEXT NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15, 4) NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    period_start DATE,
    period_end DATE,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX idx_suppliers_company ON suppliers(company_id);
CREATE INDEX idx_suppliers_performance ON suppliers(company_id, performance_score DESC);

CREATE INDEX idx_purchase_orders_company ON purchase_orders(company_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(company_id, status);
CREATE INDEX idx_purchase_orders_dates ON purchase_orders(company_id, order_date DESC);

CREATE INDEX idx_purchase_order_items_order ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_sku ON purchase_order_items(sku);

CREATE INDEX idx_financial_metrics_company ON financial_metrics(company_id);
CREATE INDEX idx_financial_metrics_period ON financial_metrics(company_id, period_start, period_end);

CREATE INDEX idx_analytics_company_type ON analytics_metrics(company_id, metric_type);
CREATE INDEX idx_analytics_calculated_at ON analytics_metrics(calculated_at DESC);

-- Enable RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY suppliers_company_access ON suppliers
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies 
            WHERE id IN (
                SELECT company_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY purchase_orders_company_access ON purchase_orders
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies 
            WHERE id IN (
                SELECT company_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY purchase_order_items_company_access ON purchase_order_items
    FOR ALL USING (
        purchase_order_id IN (
            SELECT id FROM purchase_orders 
            WHERE company_id IN (
                SELECT company_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY financial_metrics_company_access ON financial_metrics
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies 
            WHERE id IN (
                SELECT company_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY analytics_metrics_company_access ON analytics_metrics
    FOR ALL USING (
        company_id IN (
            SELECT id FROM companies 
            WHERE id IN (
                SELECT company_id FROM profiles 
                WHERE id = auth.uid()
            )
        )
    );

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_metrics_updated_at BEFORE UPDATE ON financial_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();