'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  ChevronDown,
  Plus,
  Settings,
  Users,
  Activity,
  TrendingUp,
  Package,
  DollarSign,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Entity {
  id: string;
  name: string;
  type: 'subsidiary' | 'branch' | 'partner' | 'supplier';
  status: 'active' | 'inactive' | 'pending';
  metrics?: {
    revenue?: string;
    inventory?: string;
    employees?: number;
    performance?: number;
  };
}

interface EntitySwitcherProps {
  currentEntityId?: string;
  onEntityChange?: (entityId: string) => void;
}

const mockEntities: Entity[] = [
  {
    id: 'hq',
    name: 'Headquarters',
    type: 'subsidiary',
    status: 'active',
    metrics: {
      revenue: '$5.2M',
      inventory: '$1.8M',
      employees: 150,
      performance: 92,
    },
  },
  {
    id: 'branch-1',
    name: 'East Coast Branch',
    type: 'branch',
    status: 'active',
    metrics: {
      revenue: '$2.1M',
      inventory: '$800K',
      employees: 45,
      performance: 87,
    },
  },
  {
    id: 'branch-2',
    name: 'West Coast Branch',
    type: 'branch',
    status: 'active',
    metrics: {
      revenue: '$3.4M',
      inventory: '$1.2M',
      employees: 68,
      performance: 94,
    },
  },
  {
    id: 'partner-1',
    name: 'Supply Partner Co.',
    type: 'partner',
    status: 'active',
    metrics: {
      revenue: '$890K',
      inventory: '$320K',
      employees: 12,
      performance: 78,
    },
  },
  {
    id: 'supplier-1',
    name: 'Global Suppliers Ltd.',
    type: 'supplier',
    status: 'pending',
    metrics: {
      revenue: '$450K',
      inventory: '$150K',
      employees: 8,
      performance: 65,
    },
  },
];

export function EntitySwitcher({ currentEntityId = 'hq', onEntityChange }: EntitySwitcherProps) {
  const [selectedEntity, setSelectedEntity] = useState(currentEntityId);
  const [showConsolidated, setShowConsolidated] = useState(false);

  const currentEntity = mockEntities.find(e => e.id === selectedEntity) || mockEntities[0];

  const handleEntityChange = (entityId: string) => {
    setSelectedEntity(entityId);
    if (onEntityChange) {
      onEntityChange(entityId);
    }
    toast({
      title: 'Entity Switched',
      description: `Now viewing data for ${mockEntities.find(e => e.id === entityId)?.name}`,
    });
  };

  const getEntityIcon = (type: Entity['type']) => {
    switch (type) {
      case 'subsidiary':
        return Building2;
      case 'branch':
        return Users;
      case 'partner':
        return Activity;
      case 'supplier':
        return Package;
    }
  };

  const getStatusColor = (status: Entity['status']) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'pending':
        return 'outline';
    }
  };

  const calculateConsolidatedMetrics = () => {
    const activeEntities = mockEntities.filter(e => e.status === 'active');
    return {
      totalRevenue: activeEntities.reduce((sum, e) => {
        const revenue = parseFloat(e.metrics?.revenue?.replace(/[$,M]/g, '') || '0');
        return sum + revenue;
      }, 0),
      totalInventory: activeEntities.reduce((sum, e) => {
        const inventory = parseFloat(e.metrics?.inventory?.replace(/[$,MK]/g, '') || '0');
        return sum + inventory;
      }, 0),
      totalEmployees: activeEntities.reduce((sum, e) => sum + (e.metrics?.employees || 0), 0),
      avgPerformance: Math.round(
        activeEntities.reduce((sum, e) => sum + (e.metrics?.performance || 0), 0) / activeEntities.length
      ),
    };
  };

  const consolidated = calculateConsolidatedMetrics();

  return (
    <div className="space-y-4">
      {/* Entity Selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={selectedEntity} onValueChange={handleEntityChange}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Select an entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Entities</SelectLabel>
                {mockEntities.map((entity) => {
                  const Icon = getEntityIcon(entity.type);
                  return (
                    <SelectItem key={entity.id} value={entity.id}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span>{entity.name}</span>
                        <Badge variant={getStatusColor(entity.status)} className="ml-auto">
                          {entity.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            variant={showConsolidated ? 'default' : 'outline'}
            onClick={() => setShowConsolidated(!showConsolidated)}
          >
            {showConsolidated ? 'Show Individual' : 'Show Consolidated'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Entity
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Entity Overview Card */}
      {showConsolidated ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Consolidated Network Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">${consolidated.totalRevenue.toFixed(1)}M</p>
                <p className="text-xs text-green-600">All active entities</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Inventory</p>
                <p className="text-2xl font-bold">${consolidated.totalInventory.toFixed(1)}M</p>
                <p className="text-xs text-blue-600">Combined value</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{consolidated.totalEmployees}</p>
                <p className="text-xs text-purple-600">Across network</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Avg Performance</p>
                <p className="text-2xl font-bold">{consolidated.avgPerformance}%</p>
                <p className="text-xs text-amber-600">Network average</p>
              </div>
            </div>

            {/* Entity Breakdown */}
            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-medium">Entity Breakdown</h4>
              {mockEntities
                .filter(e => e.status === 'active')
                .map((entity) => {
                  const Icon = getEntityIcon(entity.type);
                  return (
                    <div
                      key={entity.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setShowConsolidated(false);
                        handleEntityChange(entity.id);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{entity.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">{entity.metrics?.revenue}</span>
                        <Badge variant="outline">{entity.metrics?.performance}%</Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const Icon = getEntityIcon(currentEntity.type);
                return <Icon className="h-5 w-5" />;
              })()}
              {currentEntity.name}
              <Badge variant={getStatusColor(currentEntity.status)} className="ml-2">
                {currentEntity.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Revenue</p>
                </div>
                <p className="text-2xl font-bold">{currentEntity.metrics?.revenue || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Inventory</p>
                </div>
                <p className="text-2xl font-bold">{currentEntity.metrics?.inventory || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Employees</p>
                </div>
                <p className="text-2xl font-bold">{currentEntity.metrics?.employees || 'N/A'}</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Performance</p>
                </div>
                <p className="text-2xl font-bold">
                  {currentEntity.metrics?.performance ? `${currentEntity.metrics.performance}%` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                View Details
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Compare
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                Reports
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}