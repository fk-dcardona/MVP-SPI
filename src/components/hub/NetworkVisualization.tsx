'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Network,
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Package,
  Truck,
  DollarSign,
  Users,
  BarChart3,
  Globe,
  Link2,
  Eye,
  EyeOff,
  Filter,
  Download,
  Maximize2,
  Activity,
} from 'lucide-react';

interface Entity {
  id: string;
  name: string;
  type: 'subsidiary' | 'supplier' | 'customer' | 'partner' | 'warehouse';
  status: 'active' | 'warning' | 'critical' | 'inactive';
  metrics: {
    revenue: number;
    transactions: number;
    health: number;
  };
  location: string;
  position: { x: number; y: number };
}

interface Connection {
  source: string;
  target: string;
  type: 'supply' | 'demand' | 'financial' | 'logistics';
  strength: number;
  flow: number;
}

export function NetworkVisualization() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [selectedView, setSelectedView] = useState('overview');
  const [filterType, setFilterType] = useState('all');
  const [showLabels, setShowLabels] = useState(true);

  // Mock data - in real app, this would come from API
  const entities: Entity[] = [
    {
      id: 'hq',
      name: 'Headquarters',
      type: 'subsidiary',
      status: 'active',
      metrics: { revenue: 12500000, transactions: 3450, health: 95 },
      location: 'Miami, FL',
      position: { x: 400, y: 300 },
    },
    {
      id: 'sub1',
      name: 'Mexico Operations',
      type: 'subsidiary',
      status: 'active',
      metrics: { revenue: 4200000, transactions: 1230, health: 88 },
      location: 'Mexico City',
      position: { x: 250, y: 200 },
    },
    {
      id: 'sub2',
      name: 'Colombia Branch',
      type: 'subsidiary',
      status: 'warning',
      metrics: { revenue: 3100000, transactions: 890, health: 72 },
      location: 'Bogotá',
      position: { x: 550, y: 200 },
    },
    {
      id: 'sup1',
      name: 'Global Logistics Co',
      type: 'supplier',
      status: 'active',
      metrics: { revenue: 890000, transactions: 234, health: 91 },
      location: 'Shanghai',
      position: { x: 150, y: 350 },
    },
    {
      id: 'sup2',
      name: 'Tech Components Ltd',
      type: 'supplier',
      status: 'critical',
      metrics: { revenue: 560000, transactions: 145, health: 45 },
      location: 'Shenzhen',
      position: { x: 650, y: 350 },
    },
    {
      id: 'cust1',
      name: 'Retail Chain ABC',
      type: 'customer',
      status: 'active',
      metrics: { revenue: 2340000, transactions: 567, health: 85 },
      location: 'São Paulo',
      position: { x: 300, y: 450 },
    },
    {
      id: 'wh1',
      name: 'Central Warehouse',
      type: 'warehouse',
      status: 'active',
      metrics: { revenue: 0, transactions: 4560, health: 92 },
      location: 'Panama City',
      position: { x: 500, y: 450 },
    },
  ];

  const connections: Connection[] = [
    { source: 'hq', target: 'sub1', type: 'financial', strength: 0.9, flow: 85 },
    { source: 'hq', target: 'sub2', type: 'financial', strength: 0.7, flow: 65 },
    { source: 'sup1', target: 'hq', type: 'supply', strength: 0.8, flow: 78 },
    { source: 'sup2', target: 'sub2', type: 'supply', strength: 0.4, flow: 35 },
    { source: 'sub1', target: 'cust1', type: 'demand', strength: 0.6, flow: 55 },
    { source: 'hq', target: 'wh1', type: 'logistics', strength: 0.85, flow: 80 },
    { source: 'wh1', target: 'cust1', type: 'logistics', strength: 0.7, flow: 68 },
  ];

  // Network statistics
  const networkStats = {
    totalRevenue: entities.reduce((sum, e) => sum + e.metrics.revenue, 0),
    totalTransactions: entities.reduce((sum, e) => sum + e.metrics.transactions, 0),
    averageHealth: Math.round(entities.reduce((sum, e) => sum + e.metrics.health, 0) / entities.length),
    criticalEntities: entities.filter(e => e.status === 'critical').length,
    warningEntities: entities.filter(e => e.status === 'warning').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      case 'inactive': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'subsidiary': return Building2;
      case 'supplier': return Truck;
      case 'customer': return Users;
      case 'partner': return Link2;
      case 'warehouse': return Package;
      default: return Building2;
    }
  };

  // Canvas drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    connections.forEach(conn => {
      const source = entities.find(e => e.id === conn.source);
      const target = entities.find(e => e.id === conn.target);
      if (!source || !target) return;

      ctx.beginPath();
      ctx.moveTo(source.position.x, source.position.y);
      ctx.lineTo(target.position.x, target.position.y);
      
      // Connection styling based on type
      ctx.strokeStyle = conn.strength > 0.7 ? '#3b82f6' : 
                       conn.strength > 0.4 ? '#f59e0b' : '#ef4444';
      ctx.lineWidth = Math.max(1, conn.strength * 4);
      ctx.globalAlpha = 0.6;
      ctx.stroke();
      
      // Draw flow direction arrow
      const angle = Math.atan2(target.position.y - source.position.y, target.position.x - source.position.x);
      const midX = (source.position.x + target.position.x) / 2;
      const midY = (source.position.y + target.position.y) / 2;
      
      ctx.save();
      ctx.translate(midX, midY);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-10, -5);
      ctx.lineTo(-10, 5);
      ctx.closePath();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
      ctx.restore();
    });

    ctx.globalAlpha = 1;
  }, [entities, connections]);

  return (
    <div className="space-y-6">
      {/* Network Overview Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-purple-900 flex items-center gap-2">
              <Network className="h-6 w-6" />
              Multi-Entity Network Overview
            </h2>
            <p className="text-purple-700 mt-1">
              Visualize and manage your entire supply chain ecosystem
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-900">
                {entities.length}
              </div>
              <div className="text-sm text-purple-700">Entities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                ${(networkStats.totalRevenue / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-purple-700">Total Revenue</div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Network Health</p>
                <p className="text-2xl font-bold">{networkStats.averageHealth}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <Progress value={networkStats.averageHealth} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold">{networkStats.totalTransactions.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-3 text-sm text-green-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card className={networkStats.warningEntities > 0 ? 'border-amber-200' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-2xl font-bold text-amber-600">{networkStats.warningEntities}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">Entities need attention</p>
          </CardContent>
        </Card>

        <Card className={networkStats.criticalEntities > 0 ? 'border-red-200' : ''}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Issues</p>
                <p className="text-2xl font-bold text-red-600">{networkStats.criticalEntities}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-600">Immediate action required</p>
          </CardContent>
        </Card>
      </div>

      {/* Network Visualization */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Network Map</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLabels(!showLabels)}
              >
                {showLabels ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Labels
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative bg-gray-50 rounded-lg p-4" style={{ height: '600px' }}>
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="absolute inset-0 w-full h-full"
            />
            
            {/* Entity Nodes */}
            {entities.map((entity) => {
              const Icon = getEntityIcon(entity.type);
              return (
                <motion.div
                  key={entity.id}
                  className="absolute cursor-pointer"
                  style={{
                    left: entity.position.x - 40,
                    top: entity.position.y - 40,
                    width: '80px',
                  }}
                  whileHover={{ scale: 1.1 }}
                  onClick={() => setSelectedEntity(entity)}
                >
                  <div className="relative">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg border-2"
                      style={{
                        backgroundColor: 'white',
                        borderColor: getStatusColor(entity.status),
                      }}
                    >
                      <Icon className="h-6 w-6" style={{ color: getStatusColor(entity.status) }} />
                    </div>
                    {showLabels && (
                      <div className="absolute top-full mt-1 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                        <p className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded shadow">
                          {entity.name}
                        </p>
                      </div>
                    )}
                    {(entity.status === 'warning' || entity.status === 'critical') && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm">Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm">Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm">Critical</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>Line thickness = Connection strength</span>
              <span>Arrow = Flow direction</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Entity Details Panel */}
      <AnimatePresence>
        {selectedEntity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {(() => {
                      const Icon = getEntityIcon(selectedEntity.type);
                      return <Icon className="h-5 w-5" />;
                    })()}
                    {selectedEntity.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={selectedEntity.status === 'active' ? 'default' : 
                              selectedEntity.status === 'warning' ? 'secondary' : 'destructive'}
                    >
                      {selectedEntity.status}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedEntity(null)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
                <CardDescription>{selectedEntity.location}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="metrics">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                    <TabsTrigger value="connections">Connections</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="metrics" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <DollarSign className="h-8 w-8 mx-auto text-green-600 mb-2" />
                        <p className="text-sm text-gray-600">Revenue</p>
                        <p className="text-xl font-bold">
                          ${(selectedEntity.metrics.revenue / 1000000).toFixed(2)}M
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <BarChart3 className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                        <p className="text-sm text-gray-600">Transactions</p>
                        <p className="text-xl font-bold">
                          {selectedEntity.metrics.transactions}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <Activity className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                        <p className="text-sm text-gray-600">Health Score</p>
                        <p className="text-xl font-bold">
                          {selectedEntity.metrics.health}%
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="connections" className="space-y-4">
                    <div className="space-y-2">
                      {connections
                        .filter(c => c.source === selectedEntity.id || c.target === selectedEntity.id)
                        .map((conn, idx) => {
                          const otherEntityId = conn.source === selectedEntity.id ? conn.target : conn.source;
                          const otherEntity = entities.find(e => e.id === otherEntityId);
                          return (
                            <div key={idx} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {(() => {
                                  const Icon = getEntityIcon(otherEntity?.type || '');
                                  return <Icon className="h-4 w-4" />;
                                })()}
                                <span className="font-medium">{otherEntity?.name}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{conn.type}</Badge>
                                <span className="text-sm text-gray-600">{conn.flow}% flow</span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline">View Details</Button>
                      <Button variant="outline">View Reports</Button>
                      <Button variant="outline">Contact Manager</Button>
                      <Button variant="outline">Audit Trail</Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}