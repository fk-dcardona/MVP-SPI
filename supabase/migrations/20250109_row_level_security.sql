-- Enable Row Level Security on all tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's company_id
CREATE OR REPLACE FUNCTION auth.company_id()
RETURNS UUID AS $$
  SELECT company_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION auth.is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'admin' FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Helper function to check if user is admin or manager
CREATE OR REPLACE FUNCTION auth.is_admin_or_manager()
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'manager') FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Companies policies
-- Users can only see their own company
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (id = auth.company_id());

-- Only admins can update company details
CREATE POLICY "Admins can update company" ON companies
  FOR UPDATE USING (id = auth.company_id() AND auth.is_admin());

-- Profiles policies
-- Users can view profiles in their company
CREATE POLICY "Users can view company profiles" ON profiles
  FOR SELECT USING (company_id = auth.company_id());

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Admins can insert new profiles (for inviting users)
CREATE POLICY "Admins can create profiles" ON profiles
  FOR INSERT WITH CHECK (company_id = auth.company_id() AND auth.is_admin());

-- Admins can update any profile in their company
CREATE POLICY "Admins can update company profiles" ON profiles
  FOR UPDATE USING (company_id = auth.company_id() AND auth.is_admin());

-- Inventory items policies
-- All company users can view inventory
CREATE POLICY "Users can view company inventory" ON inventory_items
  FOR SELECT USING (company_id = auth.company_id());

-- Managers and admins can manage inventory
CREATE POLICY "Managers can insert inventory" ON inventory_items
  FOR INSERT WITH CHECK (company_id = auth.company_id() AND auth.is_admin_or_manager());

CREATE POLICY "Managers can update inventory" ON inventory_items
  FOR UPDATE USING (company_id = auth.company_id() AND auth.is_admin_or_manager());

CREATE POLICY "Managers can delete inventory" ON inventory_items
  FOR DELETE USING (company_id = auth.company_id() AND auth.is_admin_or_manager());

-- Sales records policies
-- All company users can view sales
CREATE POLICY "Users can view company sales" ON sales_records
  FOR SELECT USING (company_id = auth.company_id());

-- Managers and admins can manage sales records
CREATE POLICY "Managers can insert sales" ON sales_records
  FOR INSERT WITH CHECK (company_id = auth.company_id() AND auth.is_admin_or_manager());

CREATE POLICY "Managers can update sales" ON sales_records
  FOR UPDATE USING (company_id = auth.company_id() AND auth.is_admin_or_manager());

CREATE POLICY "Managers can delete sales" ON sales_records
  FOR DELETE USING (company_id = auth.company_id() AND auth.is_admin_or_manager());

-- Suppliers policies
-- All company users can view suppliers
CREATE POLICY "Users can view company suppliers" ON suppliers
  FOR SELECT USING (company_id = auth.company_id());

-- Managers and admins can manage suppliers
CREATE POLICY "Managers can insert suppliers" ON suppliers
  FOR INSERT WITH CHECK (company_id = auth.company_id() AND auth.is_admin_or_manager());

CREATE POLICY "Managers can update suppliers" ON suppliers
  FOR UPDATE USING (company_id = auth.company_id() AND auth.is_admin_or_manager());

CREATE POLICY "Managers can delete suppliers" ON suppliers
  FOR DELETE USING (company_id = auth.company_id() AND auth.is_admin_or_manager());

-- Financial data policies
-- All company users can view financial data
CREATE POLICY "Users can view company financial data" ON financial_data
  FOR SELECT USING (company_id = auth.company_id());

-- Only admins can manage financial data
CREATE POLICY "Admins can insert financial data" ON financial_data
  FOR INSERT WITH CHECK (company_id = auth.company_id() AND auth.is_admin());

CREATE POLICY "Admins can update financial data" ON financial_data
  FOR UPDATE USING (company_id = auth.company_id() AND auth.is_admin());

CREATE POLICY "Admins can delete financial data" ON financial_data
  FOR DELETE USING (company_id = auth.company_id() AND auth.is_admin());

-- Alerts policies
-- Users can view alerts assigned to them or company-wide alerts
CREATE POLICY "Users can view relevant alerts" ON alerts
  FOR SELECT USING (
    company_id = auth.company_id() AND 
    (assigned_to = auth.uid() OR assigned_to IS NULL)
  );

-- All users can create alerts
CREATE POLICY "Users can create alerts" ON alerts
  FOR INSERT WITH CHECK (company_id = auth.company_id());

-- Users can update alerts assigned to them
CREATE POLICY "Users can update assigned alerts" ON alerts
  FOR UPDATE USING (
    company_id = auth.company_id() AND 
    (assigned_to = auth.uid() OR created_by = auth.uid() OR auth.is_admin_or_manager())
  );

-- CSV uploads policies
-- All company users can view uploads
CREATE POLICY "Users can view company uploads" ON csv_uploads
  FOR SELECT USING (company_id = auth.company_id());

-- All users can create uploads
CREATE POLICY "Users can create uploads" ON csv_uploads
  FOR INSERT WITH CHECK (company_id = auth.company_id() AND uploaded_by = auth.uid());

-- Only uploader or admins can update upload records
CREATE POLICY "Users can update own uploads" ON csv_uploads
  FOR UPDATE USING (
    company_id = auth.company_id() AND 
    (uploaded_by = auth.uid() OR auth.is_admin())
  );

-- Agents policies
-- All company users can view agents
CREATE POLICY "Users can view company agents" ON agents
  FOR SELECT USING (company_id = auth.company_id());

-- Only admins can manage agents
CREATE POLICY "Admins can insert agents" ON agents
  FOR INSERT WITH CHECK (company_id = auth.company_id() AND auth.is_admin());

CREATE POLICY "Admins can update agents" ON agents
  FOR UPDATE USING (company_id = auth.company_id() AND auth.is_admin());

CREATE POLICY "Admins can delete agents" ON agents
  FOR DELETE USING (company_id = auth.company_id() AND auth.is_admin());

-- Agent executions policies
-- Users can view executions for company agents
CREATE POLICY "Users can view agent executions" ON agent_executions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = agent_executions.agent_id 
      AND agents.company_id = auth.company_id()
    )
  );

-- System can insert executions (no user direct access)
CREATE POLICY "System can insert executions" ON agent_executions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = agent_executions.agent_id 
      AND agents.company_id = auth.company_id()
    )
  );

-- Agent metrics policies
-- Users can view metrics for company agents
CREATE POLICY "Users can view agent metrics" ON agent_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = agent_metrics.agent_id 
      AND agents.company_id = auth.company_id()
    )
  );

-- System can manage metrics (no user direct access)
CREATE POLICY "System can insert metrics" ON agent_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = agent_metrics.agent_id 
      AND agents.company_id = auth.company_id()
    )
  );

CREATE POLICY "System can update metrics" ON agent_metrics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM agents 
      WHERE agents.id = agent_metrics.agent_id 
      AND agents.company_id = auth.company_id()
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'analyst')::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();