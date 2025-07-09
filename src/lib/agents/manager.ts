import { Agent, AgentExecution, AgentMetrics, ExecutionStatus } from './types';
import { AgentFactory } from './factory';
import { createServerClient } from '../supabase/server';

export class AgentManager {
  private static instance: AgentManager;
  private factory: AgentFactory;
  private runningAgents: Map<string, AbortController>;

  private constructor() {
    this.factory = AgentFactory.getInstance();
    this.runningAgents = new Map();
  }

  static getInstance(): AgentManager {
    if (!AgentManager.instance) {
      AgentManager.instance = new AgentManager();
    }
    return AgentManager.instance;
  }

  async executeAgent(agentId: string, context?: any): Promise<AgentExecution> {
    const supabase = createServerClient();
    
    try {
      // Fetch agent details
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (agentError || !agent) {
        throw new Error(`Agent not found: ${agentId}`);
      }

      // Check if agent is already running
      if (this.runningAgents.has(agentId)) {
        throw new Error(`Agent ${agentId} is already running`);
      }

      // Create execution record
      const execution: Partial<AgentExecution> = {
        agent_id: agentId,
        status: 'running' as ExecutionStatus,
        started_at: new Date()
      };

      const { data: executionRecord, error: execError } = await supabase
        .from('agent_executions')
        .insert(execution)
        .select()
        .single();

      if (execError || !executionRecord) {
        throw new Error('Failed to create execution record');
      }

      // Update agent status
      await supabase
        .from('agents')
        .update({ status: 'running' })
        .eq('id', agentId);

      // Create and configure agent instance
      const agentInstance = this.factory.createAgent(agent as Agent);
      
      // Create abort controller for cancellation
      const abortController = new AbortController();
      this.runningAgents.set(agentId, abortController);

      // Execute agent with context
      const result = await agentInstance.execute(context);

      // Update execution record with results
      const updatedExecution = {
        status: result.success ? 'completed' : 'failed' as ExecutionStatus,
        completed_at: new Date(),
        result: result.data,
        error: result.error
      };

      await supabase
        .from('agent_executions')
        .update(updatedExecution)
        .eq('id', executionRecord.id);

      // Update agent status and next run
      const nextRun = this.calculateNextRun(agent);
      await supabase
        .from('agents')
        .update({ 
          status: result.success ? 'active' : 'error',
          next_run: nextRun
        })
        .eq('id', agentId);

      // Update metrics
      await this.updateMetrics(agentId, result.success, executionRecord.started_at);

      // Remove from running agents
      this.runningAgents.delete(agentId);

      return {
        ...executionRecord,
        ...updatedExecution
      } as AgentExecution;

    } catch (error) {
      // Clean up on error
      this.runningAgents.delete(agentId);
      
      // Update agent status to error
      await supabase
        .from('agents')
        .update({ status: 'error' })
        .eq('id', agentId);

      throw error;
    }
  }

  async stopAgent(agentId: string): Promise<void> {
    const abortController = this.runningAgents.get(agentId);
    
    if (abortController) {
      abortController.abort();
      this.runningAgents.delete(agentId);
      
      const supabase = createServerClient();
      await supabase
        .from('agents')
        .update({ status: 'paused' })
        .eq('id', agentId);
    }
  }

  async getRunningAgents(): Promise<string[]> {
    return Array.from(this.runningAgents.keys());
  }

  async scheduleAgent(agentId: string, runAt: Date): Promise<void> {
    const supabase = createServerClient();
    
    await supabase
      .from('agents')
      .update({ next_run: runAt })
      .eq('id', agentId);
  }

  async runScheduledAgents(): Promise<void> {
    const supabase = createServerClient();
    
    // Find agents that need to run
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .eq('status', 'active')
      .lte('next_run', new Date().toISOString())
      .is('next_run', false);

    if (error || !agents) {
      console.error('Failed to fetch scheduled agents:', error);
      return;
    }

    // Execute each agent
    for (const agent of agents) {
      try {
        await this.executeAgent(agent.id);
      } catch (error) {
        console.error(`Failed to execute agent ${agent.id}:`, error);
      }
    }
  }

  private calculateNextRun(agent: Agent): Date | null {
    // Calculate next run based on agent type and config
    const config = agent.config as any;
    
    if (config.checkInterval) {
      // For interval-based agents
      const nextRun = new Date();
      nextRun.setMinutes(nextRun.getMinutes() + config.checkInterval);
      return nextRun;
    }
    
    if (config.schedule) {
      // For scheduled agents
      const now = new Date();
      const nextRun = new Date();
      
      switch (config.schedule) {
        case 'daily':
          nextRun.setDate(nextRun.getDate() + 1);
          nextRun.setHours(0, 0, 0, 0);
          break;
          
        case 'weekly':
          nextRun.setDate(nextRun.getDate() + 7);
          nextRun.setHours(0, 0, 0, 0);
          break;
          
        case 'monthly':
          nextRun.setMonth(nextRun.getMonth() + 1);
          nextRun.setDate(1);
          nextRun.setHours(0, 0, 0, 0);
          break;
      }
      
      return nextRun;
    }
    
    return null;
  }

  private async updateMetrics(agentId: string, success: boolean, startTime: Date): Promise<void> {
    const supabase = createServerClient();
    
    // Fetch current metrics
    const { data: metrics, error } = await supabase
      .from('agent_metrics')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    const executionTime = new Date().getTime() - new Date(startTime).getTime();
    
    if (error || !metrics) {
      // Create new metrics record
      const newMetrics: Partial<AgentMetrics> = {
        agent_id: agentId,
        total_executions: 1,
        successful_executions: success ? 1 : 0,
        failed_executions: success ? 0 : 1,
        average_execution_time: executionTime,
        last_success_at: success ? new Date() : undefined,
        last_failure_at: success ? undefined : new Date(),
        uptime_percentage: success ? 100 : 0
      };
      
      await supabase
        .from('agent_metrics')
        .insert(newMetrics);
    } else {
      // Update existing metrics
      const totalExecutions = metrics.total_executions + 1;
      const successfulExecutions = metrics.successful_executions + (success ? 1 : 0);
      const failedExecutions = metrics.failed_executions + (success ? 0 : 1);
      const avgExecutionTime = (metrics.average_execution_time * metrics.total_executions + executionTime) / totalExecutions;
      const uptimePercentage = (successfulExecutions / totalExecutions) * 100;
      
      const updatedMetrics = {
        total_executions: totalExecutions,
        successful_executions: successfulExecutions,
        failed_executions: failedExecutions,
        average_execution_time: avgExecutionTime,
        uptime_percentage: uptimePercentage,
        ...(success && { last_success_at: new Date() }),
        ...(!success && { last_failure_at: new Date() })
      };
      
      await supabase
        .from('agent_metrics')
        .update(updatedMetrics)
        .eq('agent_id', agentId);
    }
  }
}