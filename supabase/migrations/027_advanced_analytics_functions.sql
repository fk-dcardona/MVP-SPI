-- Advanced Analytics Functions based on Supply Chain Analytics Extraction

-- Function to calculate working capital metrics
CREATE OR REPLACE FUNCTION calculate_working_capital_metrics(
  p_company_id UUID,
  p_as_of_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  inventory_value DECIMAL(15, 2),
  accounts_receivable DECIMAL(15, 2),
  accounts_payable DECIMAL(15, 2),
  working_capital DECIMAL(15, 2),
  working_capital_ratio DECIMAL(5, 2),
  cash_conversion_cycle INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH inventory_data AS (
    SELECT 
      SUM(quantity * unit_cost) as total_inventory_value
    FROM inventory_items
    WHERE company_id = p_company_id
  ),
  sales_data AS (
    SELECT 
      SUM(revenue) as total_revenue,
      COUNT(DISTINCT DATE_TRUNC('day', transaction_date)) as days_with_sales
    FROM sales_transactions
    WHERE company_id = p_company_id
      AND transaction_date >= p_as_of_date - INTERVAL '90 days'
      AND transaction_date <= p_as_of_date
  ),
  purchase_data AS (
    SELECT 
      SUM(total_amount) as total_purchases,
      COUNT(DISTINCT DATE_TRUNC('day', order_date)) as days_with_purchases
    FROM purchase_orders
    WHERE company_id = p_company_id
      AND order_date >= p_as_of_date - INTERVAL '90 days'
      AND order_date <= p_as_of_date
      AND status NOT IN ('cancelled')
  ),
  turnover_metrics AS (
    SELECT 
      AVG(turnover_rate) as avg_inventory_turnover
    FROM calculate_inventory_turnover(p_company_id, 90)
  )
  SELECT 
    i.total_inventory_value as inventory_value,
    -- Estimate AR as 30 days of revenue
    (s.total_revenue / NULLIF(s.days_with_sales, 0) * 30)::DECIMAL(15, 2) as accounts_receivable,
    -- Estimate AP as 45 days of purchases
    (p.total_purchases / NULLIF(p.days_with_purchases, 0) * 45)::DECIMAL(15, 2) as accounts_payable,
    -- Working Capital = Current Assets - Current Liabilities
    (i.total_inventory_value + (s.total_revenue / NULLIF(s.days_with_sales, 0) * 30) - 
     (p.total_purchases / NULLIF(p.days_with_purchases, 0) * 45))::DECIMAL(15, 2) as working_capital,
    -- Working Capital Ratio = Current Assets / Current Liabilities
    CASE 
      WHEN (p.total_purchases / NULLIF(p.days_with_purchases, 0) * 45) > 0
      THEN ((i.total_inventory_value + (s.total_revenue / NULLIF(s.days_with_sales, 0) * 30)) / 
            (p.total_purchases / NULLIF(p.days_with_purchases, 0) * 45))::DECIMAL(5, 2)
      ELSE 0
    END as working_capital_ratio,
    -- Cash Conversion Cycle = DIO + DSO - DPO
    (CASE 
      WHEN t.avg_inventory_turnover > 0 
      THEN (365 / t.avg_inventory_turnover)::INTEGER 
      ELSE 90 
    END + 30 - 45) as cash_conversion_cycle
  FROM inventory_data i
  CROSS JOIN sales_data s
  CROSS JOIN purchase_data p
  CROSS JOIN turnover_metrics t;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate supplier performance scores
CREATE OR REPLACE FUNCTION calculate_supplier_performance(
  p_company_id UUID,
  p_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  supplier_id UUID,
  supplier_name TEXT,
  delivery_score DECIMAL(5, 2),
  quality_score DECIMAL(5, 2),
  cost_score DECIMAL(5, 2),
  responsiveness_score DECIMAL(5, 2),
  overall_score DECIMAL(5, 2),
  total_orders INTEGER,
  on_time_deliveries INTEGER,
  average_lead_time DECIMAL(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  WITH supplier_orders AS (
    SELECT 
      s.id as supplier_id,
      s.name as supplier_name,
      COUNT(po.id) as total_orders,
      COUNT(CASE 
        WHEN po.actual_delivery_date IS NOT NULL 
          AND po.actual_delivery_date <= po.expected_delivery_date 
        THEN 1 
      END) as on_time_deliveries,
      AVG(
        CASE 
          WHEN po.actual_delivery_date IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (po.actual_delivery_date - po.order_date)) / 86400
          ELSE NULL
        END
      ) as avg_lead_time,
      -- Cost variance calculation
      AVG(
        CASE 
          WHEN po.total_amount > 0 
          THEN ABS((po.total_amount - po.total_amount) / po.total_amount) * 100
          ELSE 0
        END
      ) as cost_variance
    FROM suppliers s
    LEFT JOIN purchase_orders po ON s.id = po.supplier_id
    WHERE s.company_id = p_company_id
      AND po.order_date >= CURRENT_DATE - INTERVAL '1 day' * p_days
    GROUP BY s.id, s.name
  )
  SELECT 
    supplier_id,
    supplier_name,
    -- Delivery Score (On-time delivery rate)
    CASE 
      WHEN total_orders > 0 
      THEN (on_time_deliveries::DECIMAL / total_orders * 100)::DECIMAL(5, 2)
      ELSE 0
    END as delivery_score,
    -- Quality Score (Placeholder - would need defect data)
    95.0::DECIMAL(5, 2) as quality_score,
    -- Cost Score (100 - cost variance)
    GREATEST(0, 100 - cost_variance)::DECIMAL(5, 2) as cost_score,
    -- Responsiveness Score (Based on lead time)
    CASE 
      WHEN avg_lead_time IS NOT NULL AND avg_lead_time > 0
      THEN GREATEST(0, 100 - (avg_lead_time / 30 * 50))::DECIMAL(5, 2)
      ELSE 50
    END as responsiveness_score,
    -- Overall Score (Weighted average)
    (
      (CASE WHEN total_orders > 0 THEN on_time_deliveries::DECIMAL / total_orders * 100 ELSE 0 END) * 0.35 +
      95.0 * 0.30 +
      GREATEST(0, 100 - cost_variance) * 0.20 +
      (CASE WHEN avg_lead_time IS NOT NULL THEN GREATEST(0, 100 - (avg_lead_time / 30 * 50)) ELSE 50 END) * 0.15
    )::DECIMAL(5, 2) as overall_score,
    total_orders::INTEGER,
    on_time_deliveries::INTEGER,
    avg_lead_time::DECIMAL(5, 2)
  FROM supplier_orders
  ORDER BY overall_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate demand forecast using moving average
CREATE OR REPLACE FUNCTION calculate_demand_forecast(
  p_company_id UUID,
  p_sku TEXT,
  p_forecast_days INTEGER DEFAULT 30,
  p_history_days INTEGER DEFAULT 90
)
RETURNS TABLE (
  sku TEXT,
  historical_avg_daily_demand DECIMAL(10, 2),
  forecasted_demand DECIMAL(10, 2),
  seasonality_index DECIMAL(5, 2),
  trend_direction TEXT,
  confidence_level DECIMAL(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_sales AS (
    SELECT 
      DATE_TRUNC('day', transaction_date) as sale_date,
      SUM(quantity) as daily_quantity
    FROM sales_transactions
    WHERE company_id = p_company_id
      AND sku = p_sku
      AND transaction_date >= CURRENT_DATE - INTERVAL '1 day' * p_history_days
    GROUP BY DATE_TRUNC('day', transaction_date)
  ),
  sales_stats AS (
    SELECT 
      AVG(daily_quantity) as avg_daily,
      STDDEV(daily_quantity) as stddev_daily,
      COUNT(*) as days_with_sales
    FROM daily_sales
  ),
  recent_trend AS (
    SELECT 
      AVG(daily_quantity) as recent_avg
    FROM daily_sales
    WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
  ),
  older_trend AS (
    SELECT 
      AVG(daily_quantity) as older_avg
    FROM daily_sales
    WHERE sale_date < CURRENT_DATE - INTERVAL '30 days'
  )
  SELECT 
    p_sku as sku,
    s.avg_daily::DECIMAL(10, 2) as historical_avg_daily_demand,
    (s.avg_daily * p_forecast_days)::DECIMAL(10, 2) as forecasted_demand,
    -- Seasonality index (recent vs historical)
    CASE 
      WHEN s.avg_daily > 0 
      THEN (r.recent_avg / s.avg_daily * 100)::DECIMAL(5, 2)
      ELSE 100
    END as seasonality_index,
    -- Trend direction
    CASE 
      WHEN r.recent_avg > o.older_avg * 1.1 THEN 'increasing'
      WHEN r.recent_avg < o.older_avg * 0.9 THEN 'decreasing'
      ELSE 'stable'
    END as trend_direction,
    -- Confidence level based on consistency
    CASE 
      WHEN s.days_with_sales >= p_history_days * 0.8 AND s.stddev_daily < s.avg_daily * 0.3
      THEN 90.0
      WHEN s.days_with_sales >= p_history_days * 0.5 
      THEN 70.0
      ELSE 50.0
    END::DECIMAL(5, 2) as confidence_level
  FROM sales_stats s
  CROSS JOIN recent_trend r
  CROSS JOIN older_trend o;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate risk scores
CREATE OR REPLACE FUNCTION calculate_risk_scores(
  p_company_id UUID
)
RETURNS TABLE (
  risk_category TEXT,
  risk_score DECIMAL(5, 2),
  risk_level TEXT,
  contributing_factors JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH inventory_risk AS (
    SELECT 
      COUNT(CASE WHEN days_of_supply < 7 THEN 1 END) as low_stock_items,
      COUNT(CASE WHEN days_of_supply > 90 THEN 1 END) as excess_stock_items,
      COUNT(*) as total_items
    FROM calculate_inventory_turnover(p_company_id, 30)
  ),
  supplier_risk AS (
    SELECT 
      AVG(overall_score) as avg_supplier_score,
      COUNT(CASE WHEN overall_score < 70 THEN 1 END) as poor_suppliers,
      COUNT(*) as total_suppliers
    FROM calculate_supplier_performance(p_company_id, 90)
  ),
  financial_risk AS (
    SELECT 
      working_capital_ratio,
      cash_conversion_cycle
    FROM calculate_working_capital_metrics(p_company_id)
  )
  -- Inventory Risk
  SELECT 
    'inventory' as risk_category,
    LEAST(100, 
      (i.low_stock_items::DECIMAL / NULLIF(i.total_items, 0) * 100) * 0.6 +
      (i.excess_stock_items::DECIMAL / NULLIF(i.total_items, 0) * 100) * 0.4
    )::DECIMAL(5, 2) as risk_score,
    CASE 
      WHEN (i.low_stock_items::DECIMAL / NULLIF(i.total_items, 0) * 100) > 20 THEN 'high'
      WHEN (i.low_stock_items::DECIMAL / NULLIF(i.total_items, 0) * 100) > 10 THEN 'medium'
      ELSE 'low'
    END as risk_level,
    jsonb_build_object(
      'low_stock_items', i.low_stock_items,
      'excess_stock_items', i.excess_stock_items,
      'total_items', i.total_items
    ) as contributing_factors
  FROM inventory_risk i
  
  UNION ALL
  
  -- Supplier Risk
  SELECT 
    'supplier' as risk_category,
    CASE 
      WHEN s.total_suppliers > 0 AND s.avg_supplier_score IS NOT NULL
      THEN (100 - s.avg_supplier_score)::DECIMAL(5, 2)
      ELSE 50
    END as risk_score,
    CASE 
      WHEN s.avg_supplier_score < 70 THEN 'high'
      WHEN s.avg_supplier_score < 85 THEN 'medium'
      ELSE 'low'
    END as risk_level,
    jsonb_build_object(
      'avg_supplier_score', COALESCE(s.avg_supplier_score, 0),
      'poor_suppliers', s.poor_suppliers,
      'total_suppliers', s.total_suppliers
    ) as contributing_factors
  FROM supplier_risk s
  
  UNION ALL
  
  -- Financial Risk
  SELECT 
    'financial' as risk_category,
    CASE 
      WHEN f.working_capital_ratio < 1.0 OR f.cash_conversion_cycle > 60
      THEN LEAST(100, 
        (CASE WHEN f.working_capital_ratio < 1.0 THEN 50 ELSE 0 END) +
        (CASE WHEN f.cash_conversion_cycle > 60 THEN 50 ELSE 0 END)
      )::DECIMAL(5, 2)
      ELSE 10
    END as risk_score,
    CASE 
      WHEN f.working_capital_ratio < 1.0 OR f.cash_conversion_cycle > 60 THEN 'high'
      WHEN f.working_capital_ratio < 1.5 OR f.cash_conversion_cycle > 45 THEN 'medium'
      ELSE 'low'
    END as risk_level,
    jsonb_build_object(
      'working_capital_ratio', f.working_capital_ratio,
      'cash_conversion_cycle', f.cash_conversion_cycle
    ) as contributing_factors
  FROM financial_risk f;
END;
$$ LANGUAGE plpgsql;

-- Function for cost optimization opportunities
CREATE OR REPLACE FUNCTION identify_cost_optimization_opportunities(
  p_company_id UUID,
  p_threshold_percentage DECIMAL DEFAULT 10
)
RETURNS TABLE (
  opportunity_type TEXT,
  sku TEXT,
  current_value DECIMAL(15, 2),
  potential_savings DECIMAL(15, 2),
  recommendation TEXT,
  priority INTEGER
) AS $$
BEGIN
  RETURN QUERY
  -- Excess inventory opportunities
  WITH excess_inventory AS (
    SELECT 
      i.sku,
      i.quantity * i.unit_cost as inventory_value,
      t.days_of_supply
    FROM inventory_items i
    JOIN calculate_inventory_turnover(p_company_id, 30) t ON i.sku = t.sku
    WHERE i.company_id = p_company_id
      AND t.days_of_supply > 90
  ),
  -- Slow-moving items
  slow_moving AS (
    SELECT 
      sku,
      inventory_value,
      inventory_value * 0.2 as potential_savings -- 20% holding cost
    FROM excess_inventory
    WHERE inventory_value > 1000
    ORDER BY inventory_value DESC
    LIMIT 10
  ),
  -- Price variance opportunities
  price_variance AS (
    SELECT 
      i.sku,
      i.unit_cost as current_cost,
      AVG(po_items.unit_price) as avg_purchase_price,
      i.quantity * (i.unit_cost - AVG(po_items.unit_price)) as potential_savings
    FROM inventory_items i
    JOIN purchase_order_items po_items ON i.sku = po_items.sku
    JOIN purchase_orders po ON po_items.purchase_order_id = po.id
    WHERE i.company_id = p_company_id
      AND po.order_date >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY i.sku, i.unit_cost, i.quantity
    HAVING AVG(po_items.unit_price) < i.unit_cost * (1 - p_threshold_percentage / 100)
  )
  -- Excess inventory opportunities
  SELECT 
    'excess_inventory' as opportunity_type,
    sku,
    inventory_value as current_value,
    potential_savings,
    'Reduce inventory levels for slow-moving items' as recommendation,
    1 as priority
  FROM slow_moving
  
  UNION ALL
  
  -- Price variance opportunities
  SELECT 
    'price_variance' as opportunity_type,
    sku,
    current_cost as current_value,
    potential_savings,
    'Negotiate better pricing with suppliers' as recommendation,
    2 as priority
  FROM price_variance
  WHERE potential_savings > 0
  
  ORDER BY potential_savings DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_working_capital_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_supplier_performance TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_demand_forecast TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_risk_scores TO authenticated;
GRANT EXECUTE ON FUNCTION identify_cost_optimization_opportunities TO authenticated;