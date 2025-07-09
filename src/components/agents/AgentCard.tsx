import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Agent } from '@/lib/agents/types';

interface AgentCardProps {
  agent: Agent;
  onExecute?: (id: string) => void;
  onEdit?: (agent: Agent) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string, status: 'active' | 'inactive') => void;
}

export function AgentCard({
  agent,
  onExecute,
  onEdit,
  onDelete,
  onToggleStatus
}: AgentCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'inactive':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{agent.name}</CardTitle>
            <CardDescription>{agent.description || 'No description'}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(agent.status)}`} />
            <Badge variant="outline">{agent.type}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Status:</span> {agent.status}
          </div>
          {agent.next_run && (
            <div className="text-sm text-muted-foreground">
              <span className="font-medium">Next run:</span>{' '}
              {new Date(agent.next_run).toLocaleString()}
            </div>
          )}
          <div className="flex gap-2">
            {onExecute && (
              <Button
                size="sm"
                onClick={() => onExecute(agent.id)}
                disabled={agent.status === 'error'}
              >
                Execute
              </Button>
            )}
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(agent)}
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(agent.id)}
              >
                Delete
              </Button>
            )}
            {onToggleStatus && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleStatus(agent.id, agent.status === 'active' ? 'inactive' : 'active')}
              >
                {agent.status === 'active' ? 'Deactivate' : 'Activate'}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 