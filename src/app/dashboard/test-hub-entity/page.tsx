'use client';

import { EntitySwitcher } from '@/components/hub/EntitySwitcher';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export default function TestHubEntityPage() {
  const [selectedEntity, setSelectedEntity] = useState<string>('');
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Mock callback to capture entity switches
  const handleEntityChange = (entityId: string, entityName: string) => {
    setSelectedEntity(entityId);
    setActionLog(prev => [...prev, `Switched to: ${entityName} (ID: ${entityId})`]);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hub Entity Switcher Test</CardTitle>
            <CardDescription>
              Test multi-entity management and consolidated metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Test Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Switch between different entities</li>
                <li>View consolidated metrics across all entities</li>
                <li>Check entity status indicators</li>
                <li>Compare entity performance</li>
                <li>Test quick entity actions</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <h4 className="font-medium mb-2">Expected Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Entity dropdown selector</li>
                  <li>Entity status badges (Active/Pending)</li>
                  <li>Consolidated metrics calculation</li>
                  <li>Individual entity metrics</li>
                  <li>Quick switch between entities</li>
                  <li>Visual hierarchy for headquarters</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Mock Entities:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>🏢 Headquarters (Active)</li>
                  <li>🌊 East Coast Branch (Active)</li>
                  <li>🌅 West Coast Branch (Active)</li>
                  <li>🤝 Supply Partner Co. (Active)</li>
                  <li>📦 Global Suppliers Ltd. (Pending)</li>
                </ul>
              </div>
            </div>

            {selectedEntity && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium">Currently Selected:</span> Entity ID {selectedEntity}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Entity Switcher Component</CardTitle>
          </CardHeader>
          <CardContent>
            <EntitySwitcher 
              currentEntityId={selectedEntity || 'hq-001'} 
              onEntityChange={handleEntityChange}
            />
          </CardContent>
        </Card>

        {actionLog.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Action Log</CardTitle>
              <CardDescription>
                Entity switches and actions performed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {actionLog.map((log, index) => (
                  <div key={index} className="text-sm font-mono text-muted-foreground">
                    {new Date().toLocaleTimeString()}: {log}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Consolidated Metrics Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium mb-1">Expected Behavior:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Total Revenue should sum all active entities</li>
                  <li>Employee count should aggregate across entities</li>
                  <li>Inventory value should be consolidated</li>
                  <li>Performance should be weighted average</li>
                </ul>
              </div>
              
              <div className="p-3 bg-amber-50 rounded-lg">
                <p className="font-medium mb-1">Test Calculations:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>HQ: $5.2M revenue, 150 employees</li>
                  <li>East Coast: $2.3M revenue, 75 employees</li>
                  <li>West Coast: $1.8M revenue, 60 employees</li>
                  <li>Partner: $3.5M revenue, 120 employees</li>
                  <li className="font-medium">Total: $12.8M revenue, 405 employees</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}