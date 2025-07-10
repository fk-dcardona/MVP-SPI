'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  Package,
  FileBarChart,
  Download,
  Filter,
  Calendar,
  Globe,
} from 'lucide-react';

interface EntityReport {
  id: string;
  name: string;
  region: string;
  revenue: number;
  revenueTrend: number;
  inventory: number;
  inventoryTurn: number;
  transactions: number;
  efficiency: number;
  status: 'healthy' | 'warning' | 'critical';
}

export function ConsolidatedReports() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [reportType, setReportType] = useState('financial');

  // Mock data - would come from API
  const entityReports: EntityReport[] = [
    {
      id: '1',
      name: 'Miami HQ',
      region: 'North America',
      revenue: 5200000,
      revenueTrend: 12,
      inventory: 2300000,
      inventoryTurn: 12.5,
      transactions: 1234,
      efficiency: 94,
      status: 'healthy',
    },
    {
      id: '2',
      name: 'Mexico Operations',
      region: 'North America',
      revenue: 3100000,
      revenueTrend: 8,
      inventory: 1800000,
      inventoryTurn: 10.2,
      transactions: 892,
      efficiency: 88,
      status: 'healthy',
    },
    {
      id: '3',
      name: 'Colombia Branch',
      region: 'South America',
      revenue: 2400000,
      revenueTrend: -5,
      inventory: 1500000,
      inventoryTurn: 8.7,
      transactions: 645,
      efficiency: 76,
      status: 'warning',
    },
    {
      id: '4',
      name: 'Brazil Office',
      region: 'South America',
      revenue: 1900000,
      revenueTrend: 15,
      inventory: 950000,
      inventoryTurn: 11.3,
      transactions: 523,
      efficiency: 82,
      status: 'healthy',
    },
    {
      id: '5',
      name: 'Panama Warehouse',
      region: 'Central America',
      revenue: 800000,
      revenueTrend: -2,
      inventory: 3200000,
      inventoryTurn: 6.2,
      transactions: 2341,
      efficiency: 71,
      status: 'warning',
    },
  ];

  const consolidatedMetrics = {
    totalRevenue: entityReports.reduce((sum, e) => sum + e.revenue, 0),
    avgRevenueTrend: entityReports.reduce((sum, e) => sum + e.revenueTrend, 0) / entityReports.length,
    totalInventory: entityReports.reduce((sum, e) => sum + e.inventory, 0),
    avgInventoryTurn: entityReports.reduce((sum, e) => sum + e.inventoryTurn, 0) / entityReports.length,
    totalTransactions: entityReports.reduce((sum, e) => sum + e.transactions, 0),
    avgEfficiency: Math.round(entityReports.reduce((sum, e) => sum + e.efficiency, 0) / entityReports.length),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-amber-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning': return <Badge className="bg-amber-100 text-amber-800">Warning</Badge>;
      case 'critical': return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      default: return <Badge>Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Consolidated Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Network Revenue</p>
                <p className="text-3xl font-bold">
                  ${(consolidatedMetrics.totalRevenue / 1000000).toFixed(1)}M
                </p>
                <div className={`flex items-center text-sm mt-2 ${
                  consolidatedMetrics.avgRevenueTrend > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {consolidatedMetrics.avgRevenueTrend > 0 ? 
                    <TrendingUp className="h-4 w-4 mr-1" /> : 
                    <TrendingDown className="h-4 w-4 mr-1" />
                  }
                  {Math.abs(consolidatedMetrics.avgRevenueTrend).toFixed(1)}% avg trend
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Inventory Value</p>
                <p className="text-3xl font-bold">
                  ${(consolidatedMetrics.totalInventory / 1000000).toFixed(1)}M
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Avg turn: {consolidatedMetrics.avgInventoryTurn.toFixed(1)}x
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Network Efficiency</p>
                <p className="text-3xl font-bold">{consolidatedMetrics.avgEfficiency}%</p>
                <Progress value={consolidatedMetrics.avgEfficiency} className="mt-3" />
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Consolidated Entity Reports</CardTitle>
              <CardDescription>
                Compare performance across all entities in your network
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="north-america">North America</SelectItem>
                  <SelectItem value="south-america">South America</SelectItem>
                  <SelectItem value="central-america">Central America</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                More Filters
              </Button>

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={reportType} onValueChange={setReportType}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
            </TabsList>

            <TabsContent value="financial" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Trend</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entityReports
                    .filter(e => selectedRegion === 'all' || e.region.toLowerCase().replace(' ', '-') === selectedRegion)
                    .map((entity) => (
                      <TableRow key={entity.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-gray-400" />
                            {entity.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Globe className="h-3 w-3 text-gray-400" />
                            {entity.region}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(entity.revenue / 1000000).toFixed(2)}M
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`flex items-center justify-end gap-1 ${
                            entity.revenueTrend > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {entity.revenueTrend > 0 ? 
                              <TrendingUp className="h-4 w-4" /> : 
                              <TrendingDown className="h-4 w-4" />
                            }
                            {Math.abs(entity.revenueTrend)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{entity.transactions}</TableCell>
                        <TableCell>{getStatusBadge(entity.status)}</TableCell>
                        <TableCell className="text-center">
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="operations" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead className="text-right">Efficiency</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                    <TableHead className="text-right">Avg Process Time</TableHead>
                    <TableHead className="text-right">Error Rate</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entityReports.map((entity) => (
                    <TableRow key={entity.id}>
                      <TableCell className="font-medium">{entity.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span>{entity.efficiency}%</span>
                          <Progress value={entity.efficiency} className="w-16" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{entity.transactions}</TableCell>
                      <TableCell className="text-right">2.3 mins</TableCell>
                      <TableCell className="text-right">0.8%</TableCell>
                      <TableCell>
                        <Badge variant={entity.efficiency > 85 ? 'default' : 'secondary'}>
                          {entity.efficiency > 85 ? 'Optimal' : 'Needs Review'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="inventory" className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead className="text-right">Inventory Value</TableHead>
                    <TableHead className="text-right">Turn Rate</TableHead>
                    <TableHead className="text-right">Stockout Risk</TableHead>
                    <TableHead className="text-right">Overstock %</TableHead>
                    <TableHead>Health</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entityReports.map((entity) => (
                    <TableRow key={entity.id}>
                      <TableCell className="font-medium">{entity.name}</TableCell>
                      <TableCell className="text-right">
                        ${(entity.inventory / 1000000).toFixed(2)}M
                      </TableCell>
                      <TableCell className="text-right">{entity.inventoryTurn}x</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={entity.inventoryTurn > 10 ? 'default' : 'destructive'}>
                          {entity.inventoryTurn > 10 ? 'Low' : 'High'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">12%</TableCell>
                      <TableCell>{getStatusBadge(entity.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="comparison" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Top Performers</h4>
                    <div className="space-y-2">
                      {entityReports
                        .sort((a, b) => b.efficiency - a.efficiency)
                        .slice(0, 3)
                        .map((entity, idx) => (
                          <div key={entity.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-green-600">#{idx + 1}</span>
                              <span>{entity.name}</span>
                            </div>
                            <span className="font-medium">{entity.efficiency}% efficiency</span>
                          </div>
                        ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Need Attention</h4>
                    <div className="space-y-2">
                      {entityReports
                        .filter(e => e.status === 'warning' || e.status === 'critical')
                        .map((entity) => (
                          <div key={entity.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                            <span>{entity.name}</span>
                            <span className="text-sm text-amber-700">
                              {entity.status === 'critical' ? 'Critical issues' : 'Needs review'}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                <Card className="bg-blue-50">
                  <CardContent className="p-6">
                    <h4 className="font-semibold mb-2">Network Insights</h4>
                    <ul className="space-y-2 text-sm">
                      <li>• Miami HQ drives 39% of total network revenue</li>
                      <li>• South American operations show declining trend (-5% avg)</li>
                      <li>• Panama Warehouse has lowest inventory turnover (6.2x)</li>
                      <li>• Overall network efficiency at 82% - above industry average</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}