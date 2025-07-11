#!/bin/bash

echo "🚀 Quick Database Setup for Supply Chain Intelligence"
echo "==================================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    echo "Please run this script from the project root"
    exit 1
fi

echo -e "${YELLOW}📋 Step 1: Running all migrations${NC}"
echo ""

# Create a combined SQL file
cat > temp_setup.sql << 'EOF'
-- Combined setup script for Supply Chain Intelligence Platform

-- 1. Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'manager', 'analyst')) DEFAULT 'analyst',
  phone_number TEXT,
  whatsapp_verified BOOLEAN DEFAULT FALSE,
  persona TEXT CHECK (persona IN ('streamliner', 'navigator', 'hub', 'spring', 'processor')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('inventory_monitor', 'alert_generator', 'data_processor', 'report_generator', 'optimization_engine', 'notification_dispatcher')),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'error')) DEFAULT 'inactive',
  config JSONB DEFAULT '{}',
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create inventory_items table
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_cost DECIMAL(10, 2),
  reorder_point INTEGER,
  reorder_quantity INTEGER,
  category TEXT,
  location TEXT,
  supplier TEXT,
  last_restock_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, sku)
);

-- 5. Create sales_transactions table
CREATE TABLE IF NOT EXISTS sales_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  revenue DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  customer_name TEXT,
  transaction_date DATE NOT NULL,
  fulfilled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create alert_rules table
CREATE TABLE IF NOT EXISTS alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  condition TEXT NOT NULL,
  threshold DECIMAL(10, 2),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES alert_rules(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('active', 'acknowledged', 'resolved')) DEFAULT 'active',
  data JSONB DEFAULT '{}',
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create triangle_scores table
CREATE TABLE IF NOT EXISTS triangle_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id TEXT REFERENCES companies(id) ON DELETE CASCADE,
  service_score DECIMAL(5, 2) CHECK (service_score >= 0 AND service_score <= 100),
  cost_score DECIMAL(5, 2) CHECK (cost_score >= 0 AND cost_score <= 100),
  capital_score DECIMAL(5, 2) CHECK (capital_score >= 0 AND capital_score <= 100),
  overall_score DECIMAL(5, 2) GENERATED ALWAYS AS ((service_score + cost_score + capital_score) / 3) STORED,
  metrics JSONB DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE triangle_scores ENABLE ROW LEVEL SECURITY;

-- 10. Create basic RLS policies
CREATE POLICY "Users can view their company data" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view their profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Add more policies as needed...

-- 11. Insert demo company
INSERT INTO companies (id, name, settings)
VALUES (
  'demo-company-001',
  'Demo Trading Company',
  '{
    "currency": "USD",
    "timezone": "America/New_York",
    "features": {
      "alertsEnabled": true,
      "whatsappEnabled": true,
      "autoOptimization": true
    }
  }'
) ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Database setup complete!' as message;
EOF

echo -e "${GREEN}✅ SQL file created${NC}"
echo ""
echo -e "${YELLOW}📋 Step 2: Manual Database Setup${NC}"
echo ""
echo "Please follow these steps:"
echo ""
echo "1. Go to your Supabase Dashboard:"
echo "   https://app.supabase.com/project/iagkaochjxqhjlcqfzfo/editor"
echo ""
echo "2. Click on 'SQL Editor' in the left sidebar"
echo ""
echo "3. Click 'New query'"
echo ""
echo "4. Copy and paste the contents of: temp_setup.sql"
echo ""
echo "5. Click 'Run' to execute the SQL"
echo ""
echo "6. After successful execution, run:"
echo "   ${GREEN}node scripts/create-test-users.mjs${NC}"
echo ""
echo -e "${YELLOW}Press Enter to open the SQL file in your editor...${NC}"
read

# Try to open in VS Code or default editor
if command -v code &> /dev/null; then
    code temp_setup.sql
elif command -v open &> /dev/null; then
    open temp_setup.sql
else
    cat temp_setup.sql
fi

echo ""
echo -e "${GREEN}✅ Setup script ready!${NC}"
echo ""
echo "After running the SQL in Supabase, your database will be ready."
echo "Then create test users with: node scripts/create-test-users.mjs"