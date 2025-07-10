-- Performance optimization indexes for Finkargo Analytics

-- Composite indexes for inventory analytics queries
CREATE INDEX IF NOT EXISTS idx_inventory_company_sku_date 
ON inventory_items(company_id, sku, last_updated);

CREATE INDEX IF NOT EXISTS idx_inventory_company_category 
ON inventory_items(company_id, category);

CREATE INDEX IF NOT EXISTS idx_inventory_company_quantity 
ON inventory_items(company_id, quantity)
WHERE quantity < reorder_point; -- Partial index for low stock queries

-- Composite indexes for sales analytics queries
CREATE INDEX IF NOT EXISTS idx_sales_company_sku_date 
ON sales_transactions(company_id, sku, transaction_date);

CREATE INDEX IF NOT EXISTS idx_sales_company_date_sku 
ON sales_transactions(company_id, transaction_date DESC, sku);

-- Index for velocity calculations (30-day lookback)
-- CREATE INDEX IF NOT EXISTS idx_sales_recent 
-- ON sales_transactions(company_id, transaction_date)
-- WHERE transaction_date >= (CURRENT_DATE - INTERVAL '30 days');

-- Indexes for supplier performance queries
CREATE INDEX IF NOT EXISTS idx_inventory_supplier 
ON inventory_items(company_id, supplier_name);

-- Indexes for triangle score calculations
CREATE INDEX IF NOT EXISTS idx_triangle_company_date 
ON triangle_scores(company_id, calculated_at DESC);

-- Indexes for agent processing
CREATE INDEX IF NOT EXISTS idx_agents_company_active 
ON agents(company_id, is_active)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_agents_next_run 
ON agents(next_run_at)
WHERE is_active = true AND status != 'error';

-- Function to analyze table statistics
CREATE OR REPLACE FUNCTION analyze_tables()
RETURNS void AS $$
BEGIN
  ANALYZE inventory_items;
  ANALYZE sales_transactions;
  ANALYZE triangle_scores;
  ANALYZE agents;
END;
$$ LANGUAGE plpgsql;

-- Create a materialized view for category summaries (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_category_summary AS
SELECT 
  company_id,
  category,
  COUNT(*) as sku_count,
  SUM(quantity) as total_quantity,
  SUM(quantity * unit_cost) as total_value,
  AVG(quantity::numeric / NULLIF(reorder_point, 0)) as avg_stock_ratio,
  COUNT(*) FILTER (WHERE quantity < reorder_point) as low_stock_count,
  COUNT(*) FILTER (WHERE quantity = 0) as stockout_count
FROM inventory_items
GROUP BY company_id, category;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_mv_category_summary_company 
ON mv_category_summary(company_id);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_category_summary()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_summary;
END;
$$ LANGUAGE plpgsql;

-- Create a function for efficient inventory turnover calculation
CREATE OR REPLACE FUNCTION calculate_inventory_turnover(
  p_company_id UUID,
  p_sku TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  sku TEXT,
  current_quantity INTEGER,
  current_value DECIMAL,
  units_sold INTEGER,
  turnover_rate DECIMAL,
  days_of_supply INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH recent_sales AS (
    SELECT 
      s.sku,
      SUM(s.quantity) as units_sold
    FROM sales_transactions s
    WHERE s.company_id = p_company_id
      AND s.transaction_date >= CURRENT_DATE - INTERVAL '1 day' * p_days
      AND (p_sku IS NULL OR s.sku = p_sku)
    GROUP BY s.sku
  ),
  current_inventory AS (
    SELECT 
      i.sku,
      i.quantity as current_quantity,
      i.quantity * i.unit_cost as current_value
    FROM inventory_items i
    WHERE i.company_id = p_company_id
      AND (p_sku IS NULL OR i.sku = p_sku)
  )
  SELECT 
    ci.sku,
    ci.current_quantity,
    ci.current_value,
    COALESCE(rs.units_sold, 0)::INTEGER as units_sold,
    CASE 
      WHEN ci.current_value > 0 THEN 
        (COALESCE(rs.units_sold, 0) * (365.0 / p_days)) / ci.current_quantity
      ELSE 0
    END as turnover_rate,
    CASE 
      WHEN COALESCE(rs.units_sold, 0) > 0 THEN 
        (ci.current_quantity * p_days / rs.units_sold)::INTEGER
      ELSE 999
    END as days_of_supply
  FROM current_inventory ci
  LEFT JOIN recent_sales rs ON ci.sku = rs.sku
  ORDER BY turnover_rate DESC;
END;
$$ LANGUAGE plpgsql;

-- Create compound indexes for JOIN operations
CREATE INDEX IF NOT EXISTS idx_inventory_join_sales 
ON inventory_items(company_id, sku)
INCLUDE (quantity, unit_cost, reorder_point);

-- Add table statistics comments
COMMENT ON INDEX idx_inventory_company_sku_date IS 'Primary lookup index for inventory queries';
COMMENT ON INDEX idx_sales_company_date_sku IS 'Optimized for time-series analytics';
-- COMMENT ON INDEX idx_sales_recent IS 'Partial index for recent sales velocity calculations';
COMMENT ON MATERIALIZED VIEW mv_category_summary IS 'Pre-aggregated category metrics, refresh every hour';

-- Schedule periodic VACUUM and ANALYZE (to be run by cron job)
-- This should be added to your cron configuration:
-- 0 * * * * psql -c "SELECT analyze_tables();"
-- 0 */6 * * * psql -c "SELECT refresh_category_summary();"