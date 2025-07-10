-- Row Level Security Policies for multi-tenant data isolation

-- Companies table policies
-- Users can only see their own company
CREATE POLICY "Users can view own company" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Only admins can update company settings
CREATE POLICY "Admins can update company" ON companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Profiles table policies
-- Users can view profiles from their company
CREATE POLICY "Users can view company profiles" ON profiles
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Admins can insert new profiles for their company
CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete profiles from their company (except their own)
CREATE POLICY "Admins can delete company profiles" ON profiles
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    ) AND id != auth.uid()
  );

-- Service role bypass for all tables (for server-side operations)
CREATE POLICY "Service role bypass for companies" ON companies
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role bypass for profiles" ON profiles
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Function to check if user belongs to company
CREATE OR REPLACE FUNCTION user_belongs_to_company(check_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND company_id = check_company_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin of specific company
CREATE OR REPLACE FUNCTION user_is_company_admin(check_company_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND company_id = check_company_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;