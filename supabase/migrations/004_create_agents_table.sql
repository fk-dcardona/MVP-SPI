-- Create agents table for background processing configuration
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    'inventory_monitor', 
    'alert_generator', 
    'data_processor', 
    'report_generator', 
    'optimization_engine', 
    'notification_dispatcher'
  )),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive', 'error', 'processing')),
  config JSONB DEFAULT '{}' NOT NULL,
  last_run_at TIMESTAMP WITH TIME ZONE,
  last_error TEXT,
  execution_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  UNIQUE(company_id, type) -- Only one agent of each type per company
);

-- Create indexes for performance
CREATE INDEX idx_agents_company_id ON agents(company_id);
CREATE INDEX idx_agents_type ON agents(type);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_last_run ON agents(last_run_at);

-- Enable Row Level Security (RLS)
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agents table
-- Users can view agents from their company
CREATE POLICY "Users can view company agents" ON agents
  FOR SELECT USING (user_belongs_to_company(company_id));

-- Admins and managers can create agents for their company
CREATE POLICY "Admins and managers can create agents" ON agents
  FOR INSERT WITH CHECK (
    user_belongs_to_company(company_id) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Admins and managers can update agents in their company
CREATE POLICY "Admins and managers can update agents" ON agents
  FOR UPDATE USING (
    user_belongs_to_company(company_id) AND
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
  );

-- Only admins can delete agents
CREATE POLICY "Admins can delete agents" ON agents
  FOR DELETE USING (user_is_company_admin(company_id));

-- Service role bypass for agents
CREATE POLICY "Service role bypass for agents" ON agents
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Update trigger for updated_at
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update agent status after execution
CREATE OR REPLACE FUNCTION update_agent_execution(
  p_agent_id UUID,
  p_status VARCHAR,
  p_error TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE agents
  SET 
    status = p_status,
    last_run_at = TIMEZONE('utc', NOW()),
    last_error = p_error,
    execution_count = execution_count + 1,
    updated_at = TIMEZONE('utc', NOW())
  WHERE id = p_agent_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_agent_execution TO authenticated;