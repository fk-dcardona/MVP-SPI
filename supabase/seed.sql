-- Seed data for Finkargo Analytics MVP

-- Insert demo company
INSERT INTO companies (id, name, settings, created_at)
VALUES (
  'demo-company-001',
  'Demo Trading Company',
  jsonb_build_object(
    'currency', 'USD',
    'timezone', 'America/New_York',
    'fiscalYearStart', '01-01',
    'features', jsonb_build_object(
      'alertsEnabled', true,
      'whatsappEnabled', false,
      'autoOptimization', true
    )
  ),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert demo users with different roles
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at)
VALUES 
  ('admin-user-001', 'admin@demo.com', crypt('demo123', gen_salt('bf')), NOW(), NOW()),
  ('manager-user-001', 'manager@demo.com', crypt('demo123', gen_salt('bf')), NOW(), NOW()),
  ('analyst-user-001', 'analyst@demo.com', crypt('demo123', gen_salt('bf')), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert user profiles
INSERT INTO profiles (id, company_id, email, full_name, role, phone_number, created_at)
VALUES
  ('admin-user-001', 'demo-company-001', 'admin@demo.com', 'John Admin', 'admin', '+1234567890', NOW()),
  ('manager-user-001', 'demo-company-001', 'manager@demo.com', 'Jane Manager', 'manager', '+1234567891', NOW()),
  ('analyst-user-001', 'demo-company-001', 'analyst@demo.com', 'Bob Analyst', 'analyst', '+1234567892', NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert demo agents
INSERT INTO agents (id, company_id, type, name, description, status, config, created_at)
VALUES
  ('agent-inventory-001', 'demo-company-001', 'inventory_monitor', 'Inventory Monitor', 'Monitors inventory levels and triggers alerts', 'active',
    jsonb_build_object(
      'checkInterval', 300,
      'lowStockThreshold', 10,
      'criticalStockThreshold', 5,
      'enableAlerts', true
    ), NOW()),
  
  ('agent-alert-001', 'demo-company-001', 'alert_generator', 'Alert Generator', 'Generates alerts based on configured rules', 'active',
    jsonb_build_object(
      'checkInterval', 300,
      'channels', jsonb_build_array('email', 'dashboard'),
      'severityLevels', jsonb_build_array('low', 'medium', 'high', 'critical')
    ), NOW()),
  
  ('agent-processor-001', 'demo-company-001', 'data_processor', 'Data Processor', 'Processes uploaded CSV files', 'active',
    jsonb_build_object(
      'autoProcess', true,
      'validationLevel', 'strict',
      'enableMetrics', true
    ), NOW()),
  
  ('agent-report-001', 'demo-company-001', 'report_generator', 'Report Generator', 'Generates scheduled reports', 'active',
    jsonb_build_object(
      'scheduleType', 'weekly',
      'reportFormats', jsonb_build_array('pdf', 'excel'),
      'recipients', jsonb_build_array('admin@demo.com', 'manager@demo.com')
    ), NOW()),
  
  ('agent-optimization-001', 'demo-company-001', 'optimization_engine', 'Optimization Engine', 'Optimizes supply chain metrics', 'active',
    jsonb_build_object(
      'optimizationInterval', 3600,
      'autoApply', false,
      'thresholds', jsonb_build_object(
        'service', 80,
        'cost', 70,
        'capital', 75
      )
    ), NOW()),
  
  ('agent-notification-001', 'demo-company-001', 'notification_dispatcher', 'Notification Dispatcher', 'Sends notifications via multiple channels', 'active',
    jsonb_build_object(
      'channels', jsonb_build_object(
        'email', true,
        'whatsapp', false,
        'sms', false
      ),
      'retryAttempts', 3,
      'retryDelay', 60
    ), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert sample inventory data
INSERT INTO inventory_items (id, company_id, sku, name, description, quantity, unit_cost, reorder_point, reorder_quantity, category, location, supplier, last_restock_date, created_at)
VALUES
  (gen_random_uuid(), 'demo-company-001', 'SKU001', 'Widget A', 'Standard widget type A', 150, 25.00, 50, 200, 'Widgets', 'Warehouse A', 'Supplier 1', NOW() - INTERVAL '7 days', NOW()),
  (gen_random_uuid(), 'demo-company-001', 'SKU002', 'Widget B', 'Premium widget type B', 75, 45.00, 30, 100, 'Widgets', 'Warehouse A', 'Supplier 2', NOW() - INTERVAL '14 days', NOW()),
  (gen_random_uuid(), 'demo-company-001', 'SKU003', 'Gadget X', 'Electronic gadget X', 200, 15.00, 75, 300, 'Electronics', 'Warehouse B', 'Supplier 1', NOW() - INTERVAL '5 days', NOW()),
  (gen_random_uuid(), 'demo-company-001', 'SKU004', 'Gadget Y', 'Electronic gadget Y', 45, 35.00, 25, 100, 'Electronics', 'Warehouse B', 'Supplier 3', NOW() - INTERVAL '10 days', NOW()),
  (gen_random_uuid(), 'demo-company-001', 'SKU005', 'Tool Set A', 'Professional tool set', 30, 120.00, 15, 50, 'Tools', 'Warehouse A', 'Supplier 2', NOW() - INTERVAL '20 days', NOW())
ON CONFLICT DO NOTHING;

-- Insert sample sales data (last 30 days)
INSERT INTO sales_transactions (id, company_id, sku, quantity, unit_price, revenue, customer_name, transaction_date, fulfilled, created_at)
SELECT 
  gen_random_uuid(),
  'demo-company-001',
  sku,
  quantity,
  unit_price,
  quantity * unit_price,
  customer,
  transaction_date,
  true,
  NOW()
FROM (
  VALUES
    ('SKU001', 10, 40.00, 'Customer A', NOW() - INTERVAL '1 day'),
    ('SKU001', 15, 40.00, 'Customer B', NOW() - INTERVAL '2 days'),
    ('SKU002', 5, 70.00, 'Customer A', NOW() - INTERVAL '1 day'),
    ('SKU003', 20, 25.00, 'Customer C', NOW() - INTERVAL '3 days'),
    ('SKU003', 30, 25.00, 'Customer D', NOW() - INTERVAL '5 days'),
    ('SKU004', 8, 55.00, 'Customer B', NOW() - INTERVAL '2 days'),
    ('SKU005', 2, 180.00, 'Customer E', NOW() - INTERVAL '4 days'),
    ('SKU001', 20, 40.00, 'Customer F', NOW() - INTERVAL '7 days'),
    ('SKU002', 10, 70.00, 'Customer G', NOW() - INTERVAL '10 days'),
    ('SKU003', 25, 25.00, 'Customer H', NOW() - INTERVAL '8 days')
) AS sales(sku, quantity, unit_price, customer, transaction_date);

-- Insert sample alert rules
INSERT INTO alert_rules (id, company_id, name, type, condition, threshold, severity, enabled, created_at)
VALUES
  (gen_random_uuid(), 'demo-company-001', 'Low Stock Alert', 'inventory', 'quantity_below', 20, 'medium', true, NOW()),
  (gen_random_uuid(), 'demo-company-001', 'Critical Stock Alert', 'inventory', 'quantity_below', 10, 'high', true, NOW()),
  (gen_random_uuid(), 'demo-company-001', 'High Value Order', 'sales', 'revenue_above', 1000, 'low', true, NOW()),
  (gen_random_uuid(), 'demo-company-001', 'Supply Chain Score Drop', 'performance', 'score_below', 70, 'high', true, NOW())
ON CONFLICT DO NOTHING;

-- Insert initial supply chain triangle score
INSERT INTO triangle_scores (id, company_id, service_score, cost_score, capital_score, overall_score, calculated_at)
VALUES
  (gen_random_uuid(), 'demo-company-001', 85.5, 72.3, 78.9, 78.2, NOW())
ON CONFLICT DO NOTHING;

-- Create materialized view for category summary (if not exists)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_category_summary AS
SELECT 
  company_id,
  category,
  COUNT(DISTINCT sku) as sku_count,
  SUM(quantity) as total_quantity,
  SUM(quantity * unit_cost) as total_value,
  AVG(unit_cost) as avg_unit_cost,
  MIN(quantity) as min_quantity,
  MAX(quantity) as max_quantity
FROM inventory_items
GROUP BY company_id, category;

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW mv_category_summary;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_mv_category_summary_company 
ON mv_category_summary(company_id);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;