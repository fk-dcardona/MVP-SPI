-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('inventory_monitor', 'alert_generator', 'data_processor', 'report_generator', 'optimization_engine', 'notification_dispatcher')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'running', 'error', 'paused')),
  config JSONB NOT NULL DEFAULT '{}',
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  last_run TIMESTAMP WITH TIME ZONE,
  next_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent executions table
CREATE TABLE IF NOT EXISTS agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  result JSONB,
  error TEXT,
  logs JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent metrics table
CREATE TABLE IF NOT EXISTS agent_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  total_executions INTEGER DEFAULT 0,
  successful_executions INTEGER DEFAULT 0,
  failed_executions INTEGER DEFAULT 0,
  average_execution_time_ms INTEGER DEFAULT 0,
  last_execution_time TIMESTAMP WITH TIME ZONE,
  uptime_percentage DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_company_id ON agents(company_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
CREATE INDEX IF NOT EXISTS idx_agents_next_run ON agents(next_run);

CREATE INDEX IF NOT EXISTS idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_executions_status ON agent_executions(status);
CREATE INDEX IF NOT EXISTS idx_agent_executions_started_at ON agent_executions(started_at);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON agent_metrics(agent_id);

-- Enable Row Level Security
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_metrics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for agents table
CREATE POLICY "Users can view agents for their company" ON agents
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert agents for their company" ON agents
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update agents for their company" ON agents
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete agents for their company" ON agents
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for agent_executions table
CREATE POLICY "Users can view agent executions for their company" ON agent_executions
  FOR SELECT USING (
    agent_id IN (
      SELECT a.id FROM agents a
      JOIN profiles p ON a.company_id = p.company_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert agent executions for their company" ON agent_executions
  FOR INSERT WITH CHECK (
    agent_id IN (
      SELECT a.id FROM agents a
      JOIN profiles p ON a.company_id = p.company_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update agent executions for their company" ON agent_executions
  FOR UPDATE USING (
    agent_id IN (
      SELECT a.id FROM agents a
      JOIN profiles p ON a.company_id = p.company_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Create RLS policies for agent_metrics table
CREATE POLICY "Users can view agent metrics for their company" ON agent_metrics
  FOR SELECT USING (
    agent_id IN (
      SELECT a.id FROM agents a
      JOIN profiles p ON a.company_id = p.company_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert agent metrics for their company" ON agent_metrics
  FOR INSERT WITH CHECK (
    agent_id IN (
      SELECT a.id FROM agents a
      JOIN profiles p ON a.company_id = p.company_id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update agent metrics for their company" ON agent_metrics
  FOR UPDATE USING (
    agent_id IN (
      SELECT a.id FROM agents a
      JOIN profiles p ON a.company_id = p.company_id
      WHERE p.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_metrics_updated_at BEFORE UPDATE ON agent_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically create agent metrics when agent is created
CREATE OR REPLACE FUNCTION create_agent_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO agent_metrics (agent_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to create agent metrics
CREATE TRIGGER create_agent_metrics_trigger AFTER INSERT ON agents
  FOR EACH ROW EXECUTE FUNCTION create_agent_metrics(); 