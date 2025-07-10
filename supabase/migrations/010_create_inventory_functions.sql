-- Create function to calculate inventory turnover
CREATE OR REPLACE FUNCTION calculate_inventory_turnover(
  p_company_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  sku VARCHAR,
  units_sold INTEGER,
  avg_inventory NUMERIC,
  turnover_rate NUMERIC,
  days_of_supply INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH sales_summary AS (
    SELECT 
      s.sku,
      SUM(s.quantity) as units_sold
    FROM sales_transactions s
    WHERE s.company_id = p_company_id
      AND s.transaction_date >= CURRENT_DATE - INTERVAL '1 day' * p_days
    GROUP BY s.sku
  ),
  inventory_summary AS (
    SELECT 
      i.sku,
      i.quantity as current_inventory,
      i.unit_cost
    FROM inventory_items i
    WHERE i.company_id = p_company_id
  )
  SELECT 
    i.sku,
    COALESCE(s.units_sold, 0)::INTEGER as units_sold,
    i.current_inventory::NUMERIC as avg_inventory,
    CASE 
      WHEN i.current_inventory > 0 
      THEN (COALESCE(s.units_sold, 0)::NUMERIC * (365.0 / p_days)) / i.current_inventory
      ELSE 0
    END as turnover_rate,
    CASE 
      WHEN COALESCE(s.units_sold, 0) > 0 
      THEN (i.current_inventory * p_days / s.units_sold)::INTEGER
      ELSE 999
    END as days_of_supply
  FROM inventory_summary i
  LEFT JOIN sales_summary s ON i.sku = s.sku;
END;
$$ LANGUAGE plpgsql;

-- Create function to get inventory metrics by category
CREATE OR REPLACE FUNCTION get_inventory_metrics_by_category(
  p_company_id UUID
)
RETURNS TABLE (
  category VARCHAR,
  total_skus BIGINT,
  total_quantity NUMERIC,
  total_value NUMERIC,
  avg_turnover NUMERIC,
  low_stock_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH turnover_data AS (
    SELECT * FROM calculate_inventory_turnover(p_company_id, 30)
  )
  SELECT 
    i.category,
    COUNT(DISTINCT i.sku) as total_skus,
    SUM(i.quantity)::NUMERIC as total_quantity,
    SUM(i.quantity * i.unit_cost)::NUMERIC as total_value,
    AVG(t.turnover_rate)::NUMERIC as avg_turnover,
    COUNT(CASE WHEN i.quantity <= i.reorder_point THEN 1 END) as low_stock_count
  FROM inventory_items i
  LEFT JOIN turnover_data t ON i.sku = t.sku
  WHERE i.company_id = p_company_id
  GROUP BY i.category;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate ABC analysis
CREATE OR REPLACE FUNCTION calculate_abc_analysis(
  p_company_id UUID,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  sku VARCHAR,
  revenue NUMERIC,
  revenue_percentage NUMERIC,
  cumulative_percentage NUMERIC,
  category CHAR(1)
) AS $$
BEGIN
  RETURN QUERY
  WITH revenue_data AS (
    SELECT 
      sku,
      SUM(revenue) as total_revenue
    FROM sales_transactions
    WHERE company_id = p_company_id
      AND transaction_date >= CURRENT_DATE - INTERVAL '1 day' * p_days
    GROUP BY sku
  ),
  revenue_ranked AS (
    SELECT 
      sku,
      total_revenue,
      total_revenue * 100.0 / SUM(total_revenue) OVER () as revenue_percentage,
      SUM(total_revenue * 100.0 / SUM(total_revenue) OVER ()) OVER (ORDER BY total_revenue DESC) as cumulative_percentage
    FROM revenue_data
  )
  SELECT 
    sku,
    total_revenue as revenue,
    revenue_percentage,
    cumulative_percentage,
    CASE 
      WHEN cumulative_percentage <= 80 THEN 'A'
      WHEN cumulative_percentage <= 95 THEN 'B'
      ELSE 'C'
    END::CHAR(1) as category
  FROM revenue_ranked
  ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sales_company_date 
ON sales_transactions(company_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_company_sku 
ON inventory_items(company_id, sku);

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_inventory_turnover TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_metrics_by_category TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_abc_analysis TO authenticated;