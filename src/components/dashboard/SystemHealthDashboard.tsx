'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  HardDrive,
  Shield,
  TrendingUp,
  Wifi,
  Zap,
  BarChart3,
  Network,
  Sprout,
  Compass,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SystemMetric {
  label: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  trend: number;
  icon: any;
  personaRelevance: {
    streamliner: number; // 0-10 relevance score
    navigator: number;
    hub: number;
    spring: number;
    processor: number;
  };
}

interface SystemHealthDashboardProps {
  userPersona?: string;
}

export function SystemHealthDashboard({ userPersona = 'processor' }: SystemHealthDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Universal metrics that adapt based on persona
  const systemMetrics: SystemMetric[] = [
    {
      label: 'Response Time',
      value: 47,
      unit: 'ms',
      status: 'healthy',
      trend: -12,
      icon: Zap,
      personaRelevance: {
        streamliner: 10, // Critical for speed
        navigator: 7,    // Important for control
        hub: 6,         // Matters for scale
        spring: 4,      // Less critical
        processor: 9,   // System performance
      },
    },
    {
      label: 'System Uptime',
      value: 99.97,
      unit: '%',
      status: 'healthy',
      trend: 0.02,
      icon: Activity,
      personaRelevance: {
        streamliner: 8,
        navigator: 9,
        hub: 10,      // Critical for multi-entity
        spring: 6,
        processor: 10, // Core metric
      },
    },
    {
      label: 'Error Rate',
      value: 0.03,
      unit: '%',
      status: 'healthy',
      trend: -0.01,
      icon: AlertCircle,
      personaRelevance: {
        streamliner: 7,
        navigator: 10, // Control needs low errors
        hub: 9,
        spring: 8,    // Learning from errors
        processor: 10,
      },
    },
    {
      label: 'Data Processing',
      value: 1247,
      unit: 'ops/s',
      status: 'healthy',
      trend: 15,
      icon: Database,
      personaRelevance: {
        streamliner: 9,  // Speed of processing
        navigator: 8,
        hub: 10,        // Multi-entity data
        spring: 5,
        processor: 9,
      },
    },
    {
      label: 'API Latency',
      value: 89,
      unit: 'ms',
      status: 'warning',
      trend: 23,
      icon: Wifi,
      personaRelevance: {
        streamliner: 10, // Direct impact on speed
        navigator: 7,
        hub: 8,
        spring: 4,
        processor: 8,
      },
    },
    {
      label: 'Memory Usage',
      value: 72,
      unit: '%',
      status: 'warning',
      trend: 5,
      icon: Cpu,
      personaRelevance: {
        streamliner: 6,
        navigator: 7,
        hub: 8,
        spring: 3,
        processor: 10, // System resource
      },
    },
  ];

  // Filter and sort metrics based on persona relevance
  const getPersonalizedMetrics = () => {
    return systemMetrics
      .filter(metric => metric.personaRelevance[userPersona as keyof typeof metric.personaRelevance] >= 5)
      .sort((a, b) => 
        b.personaRelevance[userPersona as keyof typeof b.personaRelevance] - 
        a.personaRelevance[userPersona as keyof typeof a.personaRelevance]
      );
  };

  const personalizedMetrics = getPersonalizedMetrics();

  // Persona-specific health summaries
  const getHealthSummary = () => {
    const summaries = {
      streamliner: {
        title: "Speed Status",
        description: "All systems optimized for maximum velocity",
        icon: Zap,
        focus: "Response times are 23% faster than baseline",
      },
      navigator: {
        title: "Control Status",
        description: "System stability within expected parameters",
        icon: Compass,
        focus: "Predictive models showing 99.2% accuracy",
      },
      hub: {
        title: "Network Status",
        description: "All entities connected and synchronized",
        icon: Network,
        focus: "Cross-entity latency under 50ms",
      },
      spring: {
        title: "Learning Environment",
        description: "Practice systems running smoothly",
        icon: Sprout,
        focus: "All tutorials and guides accessible",
      },
      processor: {
        title: "System Health",
        description: "Infrastructure operating at peak efficiency",
        icon: Shield,
        focus: "Zero critical errors in last 24 hours",
      },
    };

    return summaries[userPersona as keyof typeof summaries] || summaries.processor;
  };

  const healthSummary = getHealthSummary();

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="space-y-6">
      {/* Adaptive Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <healthSummary.icon className="h-8 w-8 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">{healthSummary.title}</h2>
            <p className="text-muted-foreground">{healthSummary.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant={autoRefresh ? "default" : "secondary"}>
            {autoRefresh ? "Live" : "Paused"}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Pause" : "Resume"}
          </Button>
        </div>
      </div>

      {/* Focus Alert - Persona Specific */}
      <Alert className="border-blue-200 bg-blue-50">
        <Activity className="h-4 w-4" />
        <AlertDescription className="font-medium">
          {healthSummary.focus}
        </AlertDescription>
      </Alert>

      {/* Metrics Grid - Dynamically Filtered */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {personalizedMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`relative overflow-hidden ${
              metric.status === 'critical' ? 'border-red-500' :
              metric.status === 'warning' ? 'border-amber-500' :
              'border-gray-200'
            }`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">{metric.label}</CardTitle>
                  <metric.icon className={`h-4 w-4 ${
                    metric.status === 'critical' ? 'text-red-500' :
                    metric.status === 'warning' ? 'text-amber-500' :
                    'text-green-500'
                  }`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">{metric.value}</span>
                    <span className="text-sm text-muted-foreground">{metric.unit}</span>
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${
                    metric.trend > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    <TrendingUp className={`h-3 w-3 ${
                      metric.trend > 0 ? 'rotate-180' : ''
                    }`} />
                    <span>{Math.abs(metric.trend)}%</span>
                  </div>
                </div>
                
                {/* Persona-specific context */}
                {userPersona === 'streamliner' && metric.label === 'Response Time' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    23% faster than average
                  </p>
                )}
                {userPersona === 'navigator' && metric.label === 'Error Rate' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Within control limits
                  </p>
                )}
                {userPersona === 'hub' && metric.label === 'Data Processing' && (
                  <p className="text-xs text-muted-foreground mt-2">
                    All entities synced
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Detailed Views - Adapt by Persona */}
      <Tabs defaultValue={userPersona === 'processor' ? 'infrastructure' : 'performance'}>
        <TabsList className="grid w-full grid-cols-4">
          {userPersona !== 'spring' && (
            <TabsTrigger value="performance">Performance</TabsTrigger>
          )}
          {userPersona !== 'streamliner' && (
            <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          )}
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>
                {userPersona === 'streamliner' 
                  ? 'Speed optimization metrics'
                  : userPersona === 'navigator'
                  ? 'Control and prediction accuracy'
                  : 'System performance over time'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  {userPersona === 'streamliner' 
                    ? 'Real-time speed metrics chart'
                    : userPersona === 'navigator'
                    ? 'Predictive model accuracy trends'
                    : 'Performance visualization'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span>45%</span>
                  </div>
                  <Progress value={45} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory</span>
                    <span>72%</span>
                  </div>
                  <Progress value={72} className="bg-amber-100" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Storage</span>
                    <span>58%</span>
                  </div>
                  <Progress value={58} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Service Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'API Gateway', status: 'operational' },
                  { name: 'Database Cluster', status: 'operational' },
                  { name: 'Cache Layer', status: 'degraded' },
                  { name: 'Queue Service', status: 'operational' },
                ].map(service => (
                  <div key={service.name} className="flex items-center justify-between">
                    <span className="text-sm">{service.name}</span>
                    <Badge variant={
                      service.status === 'operational' ? 'default' :
                      service.status === 'degraded' ? 'secondary' :
                      'destructive'
                    }>
                      {service.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>
                {userPersona === 'processor' 
                  ? 'System alerts requiring attention'
                  : 'Alerts relevant to your workflow'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {userPersona === 'streamliner' && (
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      API response time increased by 23ms in the last hour
                    </AlertDescription>
                  </Alert>
                )}
                {userPersona === 'navigator' && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Prediction accuracy dropped below 95% threshold
                    </AlertDescription>
                  </Alert>
                )}
                {userPersona === 'hub' && (
                  <Alert>
                    <Network className="h-4 w-4" />
                    <AlertDescription>
                      Entity sync delay detected for subsidiary #3
                    </AlertDescription>
                  </Alert>
                )}
                {(userPersona === 'processor' || userPersona === 'spring') && (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Scheduled maintenance window in 4 hours
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historical Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Time Range</span>
                  <select 
                    className="border rounded px-2 py-1"
                    value={selectedTimeRange}
                    onChange={(e) => setSelectedTimeRange(e.target.value)}
                  >
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
                <div className="h-48 border-2 border-dashed rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Historical trend chart</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Update */}
      <div className="text-center text-xs text-muted-foreground">
        Last updated: {lastUpdate.toLocaleTimeString()}
        {userPersona === 'streamliner' && ' • Next update in 5s'}
      </div>
    </div>
  );
}