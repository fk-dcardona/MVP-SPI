'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, Play, Pause, Settings, Trash2 } from 'lucide-react';
import type { Agent } from '@/lib/agents/types';

interface AgentCardProps {
  agent: Agent & {
    agent_metrics?: {
      total_executions: number;
      successful_executions: number;
      failed_executions: number;
      average_execution_time_ms: number;
      uptime_percentage: number;
    };
  };
  onExecute: (agentId: string) => void;
  onEdit: (agent: Agent) => void;
  onDelete: (agentId: string) => void;
  onToggleStatus: (agentId: string, status: 'active' | 'inactive') => void;
}

export function AgentCard({ 
  agent, 
  onExecute, 
  onEdit, 
  onDelete, 
  onToggleStatus 
}: AgentCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'inactive':
        return <Pause className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'inventory_monitor':
        return 'Inventory Monitor';
      case 'alert_generator':
        return 'Alert Generator';
      case 'data_processor':
        return 'Data Processor';
      case 'report_generator':
        return 'Report Generator';
      case 'optimization_engine':
        return 'Optimization Engine';
      case 'notification_dispatcher':
        return 'Notification Dispatcher';
      default:
        return type;
    }
  };

  const handleExecute = async () => {
    setIsLoading(true);
    try {
      await onExecute(agent.id);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastRun = (lastRun?: string) => {
    if (!lastRun) return 'Never';
    const date = new Date(lastRun);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const formatNextRun = (nextRun?: string) => {
    if (!nextRun) return 'Not scheduled';
    const date = new Date(nextRun);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMs < 0) return 'Overdue';
    if (diffMins < 60) return `in ${diffMins}m`;
    return `in ${diffHours}h`;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(agent.status)}
            <div>
              <CardTitle className="text-lg">{agent.name}</CardTitle>
              <CardDescription className="text-sm">
                {getTypeLabel(agent.type)}
              </CardDescription>
            </div>
          </div>
          <Badge className={getStatusColor(agent.status)}>
            {agent.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Metrics */}
        {agent.agent_metrics && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Total Executions</p>
              <p className="font-semibold">{agent.agent_metrics.total_executions}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Success Rate</p>
              <p className="font-semibold">
                {agent.agent_metrics.total_executions > 0 
                  ? `${Math.round((agent.agent_metrics.successful_executions / agent.agent_metrics.total_executions) * 100)}%`
                  : '0%'
                }
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Execution Time</p>
              <p className="font-semibold">
                {agent.agent_metrics.average_execution_time_ms > 0 
                  ? `${Math.round(agent.agent_metrics.average_execution_time_ms / 1000)}s`
                  : 'N/A'
                }
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Uptime</p>
              <p className="font-semibold">
                {agent.agent_metrics.uptime_percentage > 0 
                  ? `${agent.agent_metrics.uptime_percentage.toFixed(1)}%`
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        )}

        {/* Schedule Info */}
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Last Run:</span>
            <span>{formatLastRun((agent as any).last_run)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Next Run:</span>
            <span>{formatNextRun((agent as any).next_run)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            onClick={handleExecute}
            disabled={isLoading || agent.status === 'running'}
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-1" />
            {isLoading ? 'Executing...' : 'Execute'}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onToggleStatus(
              agent.id, 
              agent.status === 'active' ? 'inactive' : 'active'
            )}
          >
            {agent.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(agent)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(agent.id)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 