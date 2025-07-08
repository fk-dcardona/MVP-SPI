-- Enable additional RLS policies for companies
CREATE POLICY "Company admins can insert companies" ON companies
  FOR INSERT WITH CHECK (
    id IN (
      SELECT company_id FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Enable additional RLS policies for user_profiles
CREATE POLICY "Company admins can insert company profiles" ON user_profiles
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM user_profiles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);

-- Enable email confirmation (optional - can be disabled for development)
-- ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create a function to get current user's company
CREATE OR REPLACE FUNCTION get_user_company()
RETURNS UUID AS $$
DECLARE
  user_company_id UUID;
BEGIN
  SELECT company_id INTO user_company_id
  FROM user_profiles
  WHERE user_id = auth.uid();
  
  RETURN user_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 