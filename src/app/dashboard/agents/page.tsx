'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Bot, Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { AgentCard } from '@/components/agents/AgentCard';
import { EditAgentDialog } from '@/components/agents/EditAgentDialog';
import type { Agent } from '@/lib/agents/types';

interface AgentWithMetrics extends Agent {
  agent_metrics?: {
    total_executions: number;
    successful_executions: number;
    failed_executions: number;
    average_execution_time_ms: number;
    uptime_percentage: number;
  };
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<AgentWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/agents');
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }
      const data = await response.json();
      setAgents(data.agents || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAgent = async (agentId: string) => {
    try {
      const response = await fetch(`/api/agents/${agentId}/execute`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to execute agent');
      }
      
      // Refresh agents to get updated status
      await fetchAgents();
    } catch (err) {
      console.error('Error executing agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to execute agent');
    }
  };

  const handleToggleStatus = async (agentId: string, status: 'active' | 'inactive') => {
    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update agent status');
      }
      
      // Refresh agents to get updated status
      await fetchAgents();
    } catch (err) {
      console.error('Error updating agent status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update agent status');
    }
  };

  const handleDeleteAgent = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agentId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }
      
      // Refresh agents
      await fetchAgents();
    } catch (err) {
      console.error('Error deleting agent:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    }
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
  };

  const getStats = () => {
    const total = agents.length;
    const active = agents.filter(a => a.status === 'active').length;
    const running = agents.filter(a => a.status === 'running').length;
    const error = agents.filter(a => a.status === 'error').length;
    
    return { total, active, running, error };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading agents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Background Agents</h1>
          <p className="text-muted-foreground">
            Manage automated tasks and monitoring agents for your supply chain
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.running}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.error}</div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agents Grid */}
      {agents.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No agents configured</h3>
              <p className="text-muted-foreground mb-4">
                Create your first background agent to start automating supply chain tasks.
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Agent
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onExecute={handleExecuteAgent}
              onEdit={handleEditAgent}
              onDelete={handleDeleteAgent}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Edit Agent Dialog */}
      {editingAgent && (
        <EditAgentDialog
          agent={editingAgent}
          open={!!editingAgent}
          onOpenChange={(open) => {
            if (!open) {
              setEditingAgent(null);
              fetchAgents(); // Refresh agents after closing
            }
          }}
        />
      )}
    </div>
  );
} 