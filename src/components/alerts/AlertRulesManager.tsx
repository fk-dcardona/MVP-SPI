'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bell, 
  Plus, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  Mail,
  MessageSquare,
  Smartphone,
  Webhook
} from 'lucide-react';
import { AlertRule, AlertTemplate, ALERT_TEMPLATES } from '@/lib/alerts/types';

interface AlertRulesManagerProps {
  rules: AlertRule[];
  onRuleUpdate: (rule: AlertRule) => void;
  onRuleDelete: (ruleId: string) => void;
  onRuleCreate: (rule: Partial<AlertRule>) => void;
}

export function AlertRulesManager({ 
  rules, 
  onRuleUpdate, 
  onRuleDelete, 
  onRuleCreate 
}: AlertRulesManagerProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AlertTemplate | null>(null);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      case 'webhook': return <Webhook className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      default: return 'default';
    }
  };

  const handleToggleRule = (rule: AlertRule) => {
    onRuleUpdate({ ...rule, enabled: !rule.enabled });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Alert Rules</h2>
          <p className="text-gray-600">Configure automated alerts for your supply chain</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Start Templates</CardTitle>
          <CardDescription>
            Pre-configured alert rules for common scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ALERT_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="p-4 border rounded-lg cursor-pointer hover:border-blue-500 transition-colors"
                onClick={() => {
                  setSelectedTemplate(template);
                  setShowCreateDialog(true);
                }}
              >
                <h4 className="font-medium mb-1">{template.name}</h4>
                <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                <Badge variant="outline">{template.category}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Active Rules</CardTitle>
          <CardDescription>
            {rules.filter(r => r.enabled).length} of {rules.length} rules active
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-start gap-4">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => handleToggleRule(rule)}
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{rule.name}</h4>
                      <Badge variant={getSeverityColor(rule.severity)}>
                        {rule.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-500">
                        {rule.metric} {rule.operator.replace('_', ' ')} {rule.threshold_value}
                      </span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">
                        Check: {rule.check_frequency.replace('_', ' ')}
                      </span>
                      {rule.last_triggered && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">
                            Last triggered: {new Date(rule.last_triggered).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {rule.notification_channels.map((channel, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          {getChannelIcon(channel.type)}
                          <span className="text-xs text-gray-600">
                            {channel.recipients.length} recipients
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingRule(rule)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRuleDelete(rule.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {rules.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No alert rules configured yet</p>
                <p className="text-sm mt-1">Create your first rule to get started</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={showCreateDialog || !!editingRule} 
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingRule(null);
            setSelectedTemplate(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
            </DialogTitle>
            <DialogDescription>
              {selectedTemplate 
                ? `Configure the ${selectedTemplate.name} alert`
                : 'Set up automated alerts for important events'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Rule configuration form would go here */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Rule Name</Label>
                <Input 
                  id="name" 
                  placeholder="e.g., Low Stock Alert for Critical Items"
                  defaultValue={editingRule?.name || selectedTemplate?.name}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  placeholder="Brief description of what this rule does"
                  defaultValue={editingRule?.description || selectedTemplate?.description}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="metric">Metric</Label>
                  <Input 
                    id="metric" 
                    placeholder="e.g., quantity_on_hand"
                    defaultValue={editingRule?.metric || selectedTemplate?.default_rule.metric}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="threshold">Threshold</Label>
                  <Input 
                    id="threshold" 
                    type="number"
                    placeholder="e.g., 10"
                    defaultValue={editingRule?.threshold_value}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="severity">Severity</Label>
                  <Select defaultValue={editingRule?.severity || 'medium'}>
                    <SelectTrigger id="severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="frequency">Check Frequency</Label>
                  <Select defaultValue={editingRule?.check_frequency || 'every_15_minutes'}>
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real_time">Real Time</SelectItem>
                      <SelectItem value="every_5_minutes">Every 5 Minutes</SelectItem>
                      <SelectItem value="every_15_minutes">Every 15 Minutes</SelectItem>
                      <SelectItem value="every_30_minutes">Every 30 Minutes</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setEditingRule(null);
              setSelectedTemplate(null);
            }}>
              Cancel
            </Button>
            <Button onClick={() => {
              // Handle save
              setShowCreateDialog(false);
              setEditingRule(null);
              setSelectedTemplate(null);
            }}>
              {editingRule ? 'Save Changes' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}