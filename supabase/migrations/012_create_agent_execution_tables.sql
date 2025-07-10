-- Create agent_executions table for tracking agent runs
CREATE TABLE IF NOT EXISTS public.agent_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    result JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agent_metrics table for performance tracking
CREATE TABLE IF NOT EXISTS public.agent_metrics (
    agent_id UUID PRIMARY KEY REFERENCES public.agents(id) ON DELETE CASCADE,
    total_executions INTEGER DEFAULT 0,
    successful_executions INTEGER DEFAULT 0,
    failed_executions INTEGER DEFAULT 0,
    average_execution_time DECIMAL,
    last_success_at TIMESTAMP WITH TIME ZONE,
    last_failure_at TIMESTAMP WITH TIME ZONE,
    uptime_percentage DECIMAL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create optimization_results table for storing optimization suggestions
CREATE TABLE IF NOT EXISTS public.optimization_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
    optimization_type VARCHAR(50),
    current_value DECIMAL,
    recommended_value DECIMAL,
    potential_savings DECIMAL,
    confidence_score DECIMAL,
    applied BOOLEAN DEFAULT FALSE,
    applied_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimization_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agent_executions
CREATE POLICY "Users can view their company's agent executions" ON public.agent_executions
    FOR SELECT USING (
        agent_id IN (
            SELECT id FROM public.agents 
            WHERE company_id IN (
                SELECT company_id FROM public.profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "System can manage executions" ON public.agent_executions
    FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for agent_metrics
CREATE POLICY "Users can view their company's agent metrics" ON public.agent_metrics
    FOR SELECT USING (
        agent_id IN (
            SELECT id FROM public.agents 
            WHERE company_id IN (
                SELECT company_id FROM public.profiles 
                WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "System can manage metrics" ON public.agent_metrics
    FOR ALL USING (true) WITH CHECK (true);

-- RLS Policies for optimization_results
CREATE POLICY "Users can view their company's optimizations" ON public.optimization_results
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage optimizations" ON public.optimization_results
    FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_agent_executions_agent_id ON public.agent_executions(agent_id);
CREATE INDEX idx_agent_executions_status ON public.agent_executions(status);
CREATE INDEX idx_optimization_results_company_id ON public.optimization_results(company_id);
CREATE INDEX idx_optimization_results_applied ON public.optimization_results(applied);