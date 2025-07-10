'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  BarChart3,
  DollarSign,
  Package,
  TrendingUp,
  AlertCircle,
  Clock,
  Shield,
  Activity,
  Users,
  FileText,
  Settings,
  Save,
  RotateCcw,
  Plus,
  X,
} from 'lucide-react';

interface Widget {
  id: string;
  title: string;
  icon: any;
  enabled: boolean;
  size: 'small' | 'medium' | 'large';
  position: number;
}

interface SortableWidgetProps {
  widget: Widget;
  onToggle: (id: string) => void;
  onSizeChange: (id: string, size: 'small' | 'medium' | 'large') => void;
}

function SortableWidget({ widget, onToggle, onSizeChange }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getWidgetSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-2';
      case 'large': return 'col-span-3';
      default: return 'col-span-1';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${getWidgetSizeClass(widget.size)} ${!widget.enabled ? 'opacity-50' : ''}`}
    >
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                className="cursor-grab hover:bg-gray-100 rounded p-1"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
              </button>
              <widget.icon className="h-4 w-4 text-gray-600" />
              <CardTitle className="text-sm">{widget.title}</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={widget.size}
                onChange={(e) => onSizeChange(widget.id, e.target.value as any)}
                className="text-xs border rounded px-1 py-0.5"
                disabled={!widget.enabled}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              <Switch
                checked={widget.enabled}
                onCheckedChange={() => onToggle(widget.id)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-24 bg-gray-50 rounded flex items-center justify-center text-gray-400">
            Widget Preview
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardCustomization() {
  const [widgets, setWidgets] = useState<Widget[]>([
    { id: 'cash-flow', title: 'Cash Flow Forecast', icon: DollarSign, enabled: true, size: 'medium', position: 0 },
    { id: 'inventory', title: 'Inventory Levels', icon: Package, enabled: true, size: 'small', position: 1 },
    { id: 'trends', title: 'Market Trends', icon: TrendingUp, enabled: true, size: 'small', position: 2 },
    { id: 'alerts', title: 'Risk Alerts', icon: AlertCircle, enabled: true, size: 'medium', position: 3 },
    { id: 'performance', title: 'Performance Metrics', icon: BarChart3, enabled: false, size: 'large', position: 4 },
    { id: 'timeline', title: 'Timeline View', icon: Clock, enabled: false, size: 'medium', position: 5 },
    { id: 'security', title: 'Security Status', icon: Shield, enabled: false, size: 'small', position: 6 },
    { id: 'activity', title: 'Real-time Activity', icon: Activity, enabled: true, size: 'medium', position: 7 },
    { id: 'suppliers', title: 'Supplier Network', icon: Users, enabled: false, size: 'medium', position: 8 },
    { id: 'documents', title: 'Document Center', icon: FileText, enabled: false, size: 'small', position: 9 },
  ]);

  const [savedLayouts, setSavedLayouts] = useState([
    { id: 'default', name: 'Default Layout', widgets: [...widgets] },
    { id: 'financial', name: 'Financial Focus', widgets: [] },
    { id: 'operations', name: 'Operations View', widgets: [] },
  ]);

  const [selectedLayout, setSelectedLayout] = useState('default');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleWidget = (id: string) => {
    setWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const changeSize = (id: string, size: 'small' | 'medium' | 'large') => {
    setWidgets(prev =>
      prev.map(w => (w.id === id ? { ...w, size } : w))
    );
  };

  const saveCurrentLayout = () => {
    // In a real app, this would save to backend
    alert('Layout saved successfully!');
  };

  const resetToDefault = () => {
    setWidgets(savedLayouts[0].widgets);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customize Your Dashboard</CardTitle>
              <CardDescription>
                Drag and drop widgets to rearrange. Toggle to show/hide. Adjust sizes for optimal viewing.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetToDefault}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={saveCurrentLayout}>
                <Save className="h-4 w-4 mr-1" />
                Save Layout
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value="widgets" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="widgets">Widgets</TabsTrigger>
              <TabsTrigger value="layouts">Saved Layouts</TabsTrigger>
              <TabsTrigger value="settings">Display Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="widgets" className="mt-6">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={widgets.map(w => w.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid grid-cols-3 gap-4">
                    {widgets.map((widget) => (
                      <SortableWidget
                        key={widget.id}
                        widget={widget}
                        onToggle={toggleWidget}
                        onSizeChange={changeSize}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Pro tip:</strong> Arrange your most important metrics at the top. 
                  Use large widgets for data you need to monitor closely.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="layouts" className="mt-6 space-y-4">
              {savedLayouts.map((layout) => (
                <Card key={layout.id} className="cursor-pointer hover:border-blue-500 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold">{layout.name}</h4>
                        <p className="text-sm text-gray-500">
                          {layout.widgets.filter(w => w.enabled).length} active widgets
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={selectedLayout === layout.id ? 'default' : 'outline'}
                        onClick={() => setSelectedLayout(layout.id)}
                      >
                        {selectedLayout === layout.id ? 'Active' : 'Load'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-1" />
                Create New Layout
              </Button>
            </TabsContent>

            <TabsContent value="settings" className="mt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="auto-refresh">Auto-refresh data</Label>
                    <p className="text-sm text-gray-500">Update dashboard every 30 seconds</p>
                  </div>
                  <Switch id="auto-refresh" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="animations">Enable animations</Label>
                    <p className="text-sm text-gray-500">Smooth transitions and hover effects</p>
                  </div>
                  <Switch id="animations" defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="compact">Compact mode</Label>
                    <p className="text-sm text-gray-500">Reduce spacing for more content</p>
                  </div>
                  <Switch id="compact" />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="tooltips">Show tooltips</Label>
                    <p className="text-sm text-gray-500">Display helpful hints on hover</p>
                  </div>
                  <Switch id="tooltips" defaultChecked />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">Data Density</h4>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant="outline" size="sm">Comfortable</Button>
                  <Button variant="default" size="sm">Standard</Button>
                  <Button variant="outline" size="sm">Compact</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Preview Area */}
      <Card>
        <CardHeader>
          <CardTitle>Dashboard Preview</CardTitle>
          <CardDescription>
            This is how your dashboard will look with current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {widgets
              .filter(w => w.enabled)
              .sort((a, b) => a.position - b.position)
              .map((widget) => (
                <div
                  key={widget.id}
                  className={`${
                    widget.size === 'small' ? 'col-span-1' :
                    widget.size === 'medium' ? 'col-span-2' :
                    'col-span-3'
                  }`}
                >
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <widget.icon className="h-4 w-4" />
                        {widget.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded" />
                    </CardContent>
                  </Card>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}