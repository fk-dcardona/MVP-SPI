'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  Shield, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

export function NavigatorControlPanel() {
  // Mock system health data
  const systemHealth = {
    overall: 92,
    agents: { active: 5, total: 6 },
    dataQuality: 88,
    lastUpdate: '2 minutes ago',
    alerts: 3,
    pendingTasks: 7
  };

  const controls = [
    {
      label: 'System Settings',
      icon: <Settings className="h-4 w-4" />,
      status: 'active',
      action: '/dashboard/settings'
    },
    {
      label: 'Risk Management',
      icon: <Shield className="h-4 w-4" />,
      status: 'warning',
      action: '/dashboard/risk'
    },
    {
      label: 'Performance Tuning',
      icon: <TrendingUp className="h-4 w-4" />,
      status: 'active',
      action: '/dashboard/performance'
    },
    {
      label: 'Custom Reports',
      icon: <BarChart3 className="h-4 w-4" />,
      status: 'active',
      action: '/dashboard/reports'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* System Health Overview */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            System Health Overview
            <Badge variant={systemHealth.overall >= 90 ? 'default' : 'destructive'}>
              {systemHealth.overall}% Healthy
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Health Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Agent Status</span>
                  <span className="text-sm font-medium">
                    {systemHealth.agents.active}/{systemHealth.agents.total} Active
                  </span>
                </div>
                <Progress value={(systemHealth.agents.active / systemHealth.agents.total) * 100} />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Data Quality</span>
                  <span className="text-sm font-medium">{systemHealth.dataQuality}%</span>
                </div>
                <Progress value={systemHealth.dataQuality} />
              </div>
            </div>

            {/* Status Indicators */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-amber-600">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  <span className="text-sm">{systemHealth.alerts} Alerts</span>
                </div>
                <div className="flex items-center text-blue-600">
                  <Clock className="h-4 w-4 mr-1" />
                  <span className="text-sm">{systemHealth.pendingTasks} Pending</span>
                </div>
              </div>
              <span className="text-xs text-gray-500">
                Last update: {systemHealth.lastUpdate}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {controls.map((control, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start"
                onClick={() => console.log(`Navigate to ${control.action}`)}
              >
                {control.icon}
                <span className="ml-2 flex-1 text-left">{control.label}</span>
                {control.status === 'warning' && (
                  <Badge variant="destructive" className="ml-2">!</Badge>
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}