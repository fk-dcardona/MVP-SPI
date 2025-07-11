-- Essential Database Setup for Core Functionality
-- This script creates only the tables needed for basic auth and CSV upload

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Companies table (minimal)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User profiles (minimal - users handled by Supabase Auth)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Simple CSV uploads table
CREATE TABLE IF NOT EXISTS csv_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  company_id UUID REFERENCES companies(id),
  filename TEXT NOT NULL,
  file_size INTEGER,
  upload_date TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'uploaded',
  data JSONB -- Store parsed CSV data as JSON
);

-- Basic RLS policies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_uploads ENABLE ROW LEVEL SECURITY;

-- Companies policy
CREATE POLICY "Users can view their own company" ON companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM user_profiles WHERE id = auth.uid()
    )
  );

-- User profiles policy
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (id = auth.uid());

-- CSV uploads policy
CREATE POLICY "Users can manage their own uploads" ON csv_uploads
  FOR ALL USING (user_id = auth.uid());

-- Insert a default company for testing
INSERT INTO companies (id, name) 
VALUES ('550e8400-e29b-41d4-a716-446655440000', 'Demo Company')
ON CONFLICT DO NOTHING;