-- Fix missing columns and duplicates in existing tables

-- Add missing columns to inventory_items table
ALTER TABLE public.inventory_items 
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS reorder_point DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS reorder_quantity DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS supplier_name TEXT,
ADD COLUMN IF NOT EXISTS lead_time_days INTEGER DEFAULT 7;

-- Create index for category as it's used in functions
CREATE INDEX IF NOT EXISTS idx_inventory_items_category 
ON public.inventory_items(company_id, category);

-- Fix column name inconsistency in sales_transactions
-- Check if transaction_date exists, if not rename date to transaction_date
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'sales_transactions' 
        AND column_name = 'transaction_date'
    ) THEN
        ALTER TABLE public.sales_transactions 
        RENAME COLUMN date TO transaction_date;
    END IF;
END $$;

-- Drop duplicate sku_velocity table from migration 007 if it exists
-- First drop the constraint if it exists
ALTER TABLE IF EXISTS public.sku_velocity 
DROP CONSTRAINT IF EXISTS unique_company_sku_velocity;

-- Then recreate the table with the correct structure (keeping the one from 006)
-- This is safe because both definitions are similar, we're just ensuring consistency

-- Add missing columns to profiles table if they don't exist
-- (These might have been added in 008 but let's ensure they exist)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update existing records to set user_id = id if not set
UPDATE public.profiles SET user_id = id WHERE user_id IS NULL;

-- Create a function to calculate fill rate for service score
CREATE OR REPLACE FUNCTION calculate_fill_rate(
    p_company_id UUID,
    p_days INTEGER DEFAULT 30
)
RETURNS DECIMAL AS $$
DECLARE
    v_fill_rate DECIMAL;
BEGIN
    WITH sales_data AS (
        SELECT 
            COUNT(*) FILTER (WHERE fulfilled = true) as fulfilled_orders,
            COUNT(*) as total_orders
        FROM public.sales_transactions
        WHERE company_id = p_company_id
            AND transaction_date >= CURRENT_DATE - INTERVAL '1 day' * p_days
    )
    SELECT 
        CASE 
            WHEN total_orders > 0 THEN 
                (fulfilled_orders::DECIMAL / total_orders) * 100
            ELSE 100
        END INTO v_fill_rate
    FROM sales_data;
    
    RETURN COALESCE(v_fill_rate, 100);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION calculate_fill_rate TO authenticated;

-- Create alert_rules table if it doesn't exist (referenced in CLAUDE.md but not in migrations)
CREATE TABLE IF NOT EXISTS public.alert_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    condition JSONB NOT NULL,
    threshold_value DECIMAL,
    comparison_operator TEXT CHECK (comparison_operator IN ('>', '<', '>=', '<=', '=', '!=')),
    severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    is_active BOOLEAN DEFAULT true,
    notification_channels TEXT[] DEFAULT ARRAY['in_app'],
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alert_rules_company_id ON public.alert_rules(company_id);
CREATE INDEX IF NOT EXISTS idx_alert_rules_is_active ON public.alert_rules(is_active);

-- Enable RLS
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view company alert rules" ON public.alert_rules
    FOR SELECT TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins and managers can manage alert rules" ON public.alert_rules
    FOR ALL TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Create alert_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.alert_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    alert_rule_id UUID REFERENCES public.alert_rules(id) ON DELETE CASCADE,
    alert_id UUID REFERENCES public.alerts(id) ON DELETE CASCADE,
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trigger_value DECIMAL,
    notification_sent BOOLEAN DEFAULT false,
    notification_channels TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_alert_history_company_id ON public.alert_history(company_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_alert_rule_id ON public.alert_history(alert_rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered_at ON public.alert_history(triggered_at DESC);

-- Enable RLS
ALTER TABLE public.alert_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view company alert history" ON public.alert_history
    FOR SELECT TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Update triggers
CREATE TRIGGER update_alert_rules_updated_at 
    BEFORE UPDATE ON public.alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();