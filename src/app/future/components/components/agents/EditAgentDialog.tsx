'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectOption } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Agent, AgentType } from '@/lib/agents/types';

interface EditAgentDialogProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAgentDialog({ agent, open, onOpenChange }: EditAgentDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    name: agent.name,
    description: agent.description || '',
    type: agent.type,
    status: agent.status,
    config: JSON.stringify(agent.config, null, 2)
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Parse and validate config
      let config;
      try {
        config = JSON.parse(formData.config);
      } catch (err) {
        throw new Error('Invalid JSON configuration');
      }

      // Basic config validation - detailed validation happens on server
      if (!config || typeof config !== 'object') {
        throw new Error('Configuration must be a valid JSON object');
      }

      const response = await fetch(`/api/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          type: formData.type,
          status: formData.status,
          config
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update agent');
      }

      router.refresh();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update agent');
    } finally {
      setLoading(false);
    }
  };

  const getConfigHelp = () => {
    // Basic default configs for different agent types
    const defaultConfigs = {
      inventory_monitor: { thresholds: { low: 10, critical: 5 } },
      alert_generator: { priority: 'medium', channels: ['email'] },
      data_processor: { batchSize: 1000, retryCount: 3 },
      report_generator: { format: 'json', includeCharts: true },
      optimization_engine: { strategy: 'cost', autoApply: false },
      notification_dispatcher: { channels: ['whatsapp'], template: 'default' }
    };
    return JSON.stringify(defaultConfigs[formData.type as AgentType] || {}, null, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Agent</DialogTitle>
            <DialogDescription>
              Update the agent configuration. Changes will take effect on the next run.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this agent does..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AgentType })}
                disabled
              >
                <SelectOption value="inventory_monitor">Inventory Monitor</SelectOption>
                <SelectOption value="alert_generator">Alert Generator</SelectOption>
                <SelectOption value="data_processor">Data Processor</SelectOption>
                <SelectOption value="report_generator">Report Generator</SelectOption>
                <SelectOption value="optimization_engine">Optimization Engine</SelectOption>
                <SelectOption value="notification_dispatcher">Notification Dispatcher</SelectOption>
              </Select>
              <p className="text-sm text-muted-foreground">
                Agent type cannot be changed after creation
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <SelectOption value="active">Active</SelectOption>
                <SelectOption value="inactive">Inactive</SelectOption>
                <SelectOption value="paused">Paused</SelectOption>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="config">Configuration (JSON)</Label>
              <Textarea
                id="config"
                value={formData.config}
                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                className="font-mono text-sm"
                rows={10}
                required
              />
              <details className="text-sm text-muted-foreground">
                <summary className="cursor-pointer">View example configuration</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {getConfigHelp()}
                </pre>
              </details>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}