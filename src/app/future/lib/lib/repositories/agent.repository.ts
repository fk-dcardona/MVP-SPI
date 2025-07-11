import { BaseRepository } from './base.repository';

export type AgentType = 
  | 'inventory_monitor' 
  | 'alert_generator' 
  | 'data_processor' 
  | 'report_generator' 
  | 'optimization_engine' 
  | 'notification_dispatcher';

export type AgentStatus = 'active' | 'inactive' | 'running' | 'error';

export interface Agent {
  id: string;
  company_id: string;
  name: string;
  type: AgentType;
  status: AgentStatus;
  configuration: Record<string, any>;
  last_run_at?: string;
  next_run_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  error_message?: string;
  run_count: number;
  success_count: number;
  failure_count: number;
  average_runtime_ms?: number;
}

export class AgentRepository extends BaseRepository<Agent> {
  constructor() {
    super('agents');
  }

  async findByCompany(companyId: string) {
    return this.findAll({
      filters: { company_id: companyId },
      orderBy: { column: 'name', ascending: true }
    });
  }

  async findActive(companyId: string) {
    return this.findAll({
      filters: { company_id: companyId, status: 'active' }
    });
  }

  async findByType(companyId: string, type: AgentType) {
    return this.findAll({
      filters: { company_id: companyId, type }
    });
  }

  async findScheduledToRun() {
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('status', 'active')
        .lte('next_run_at', now)
        .order('next_run_at', { ascending: true });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }

  async updateStatus(id: string, status: AgentStatus, errorMessage?: string) {
    const payload: Partial<Agent> = {
      status,
      updated_at: new Date().toISOString()
    };

    if (errorMessage) {
      payload.error_message = errorMessage;
    }

    // Note: Increment failure count will be handled in updateLastRun method

    return this.update(id, payload);
  }

  async updateLastRun(id: string, success: boolean, runtimeMs: number) {
    try {
      const { data, error: fetchError } = await this.findById(id);
      
      if (fetchError || !data) throw fetchError || new Error('Agent not found');
      
      // Type assertion since we know findById returns a single agent
      const agent = data as Agent;

      const newRunCount = agent.run_count + 1;
      const newSuccessCount = success ? agent.success_count + 1 : agent.success_count;
      const newFailureCount = !success ? agent.failure_count + 1 : agent.failure_count;
      
      // Calculate new average runtime
      const currentAvg = agent.average_runtime_ms || 0;
      const newAvg = Math.round(((currentAvg * agent.run_count) + runtimeMs) / newRunCount);

      const payload: Partial<Agent> = {
        last_run_at: new Date().toISOString(),
        run_count: newRunCount,
        success_count: newSuccessCount,
        failure_count: newFailureCount,
        average_runtime_ms: newAvg,
        status: success ? 'active' : 'error',
        updated_at: new Date().toISOString()
      };

      if (!success) {
        payload.error_message = 'Agent execution failed';
      } else {
        payload.error_message = null;
      }

      return this.update(id, payload);
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }

  async scheduleNextRun(id: string, intervalMinutes: number) {
    const nextRun = new Date();
    nextRun.setMinutes(nextRun.getMinutes() + intervalMinutes);

    return this.update(id, {
      next_run_at: nextRun.toISOString(),
      updated_at: new Date().toISOString()
    });
  }

  async getExecutionStats(companyId: string) {
    try {
      const { data: agents, error } = await this.findByCompany(companyId);

      if (error) throw error;

      const stats = {
        totalAgents: agents?.length || 0,
        activeAgents: 0,
        errorAgents: 0,
        totalRuns: 0,
        totalSuccesses: 0,
        totalFailures: 0,
        averageRuntime: 0,
        agentsByType: new Map<AgentType, number>()
      };

      let totalRuntime = 0;
      let runtimeCount = 0;

      agents?.forEach(agent => {
        if (agent.status === 'active') stats.activeAgents++;
        if (agent.status === 'error') stats.errorAgents++;
        
        stats.totalRuns += agent.run_count;
        stats.totalSuccesses += agent.success_count;
        stats.totalFailures += agent.failure_count;
        
        if (agent.average_runtime_ms) {
          totalRuntime += agent.average_runtime_ms * agent.run_count;
          runtimeCount += agent.run_count;
        }

        const typeCount = stats.agentsByType.get(agent.type) || 0;
        stats.agentsByType.set(agent.type, typeCount + 1);
      });

      stats.averageRuntime = runtimeCount > 0 ? totalRuntime / runtimeCount : 0;

      return {
        data: {
          ...stats,
          agentsByType: Array.from(stats.agentsByType.entries()).map(([type, count]) => ({ type, count }))
        },
        error: null
      };
    } catch (error) {
      return { 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error') 
      };
    }
  }
}