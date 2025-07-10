'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Widget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  enabled: boolean;
}

interface SavedView {
  id: string;
  name: string;
  widgets: string[];
  isDefault: boolean;
  lastModified: Date;
}

const availableWidgets: Widget[] = [
  { id: 'system-health', type: 'health', title: 'System Health Overview', size: 'medium', enabled: true },
  { id: 'quick-controls', type: 'controls', title: 'Quick Controls', size: 'small', enabled: true },
  { id: 'triangle-score', type: 'triangle', title: 'Supply Chain Triangle', size: 'medium', enabled: true },
  { id: 'recent-activity', type: 'activity', title: 'Recent Activity', size: 'large', enabled: true },
  { id: 'alerts-panel', type: 'alerts', title: 'Alerts & Notifications', size: 'medium', enabled: false },
  { id: 'performance-metrics', type: 'metrics', title: 'Performance Metrics', size: 'large', enabled: false },
  { id: 'data-quality', type: 'quality', title: 'Data Quality Monitor', size: 'small', enabled: false },
  { id: 'agent-status', type: 'agents', title: 'Agent Status Board', size: 'medium', enabled: false },
];

function SortableWidget({ widget }: { widget: Widget }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        p-4 border rounded-lg bg-white cursor-move
        ${isDragging ? 'shadow-lg' : 'shadow-sm'}
        ${widget.size === 'small' ? 'col-span-1' : widget.size === 'large' ? 'col-span-3' : 'col-span-2'}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium">{widget.title}</h4>
        <Badge variant={widget.enabled ? "default" : "secondary"}>
          {widget.enabled ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground">
        Drag to reorder • Size: {widget.size}
      </div>
    </div>
  );
}

export function NavigatorCustomization() {
  const [widgets, setWidgets] = useState(availableWidgets);
  const [savedViews, setSavedViews] = useState<SavedView[]>([
    {
      id: 'default',
      name: 'Default View',
      widgets: ['system-health', 'quick-controls', 'triangle-score', 'recent-activity'],
      isDefault: true,
      lastModified: new Date(),
    },
    {
      id: 'monitoring',
      name: 'Monitoring Focus',
      widgets: ['system-health', 'agent-status', 'data-quality', 'alerts-panel'],
      isDefault: false,
      lastModified: new Date(Date.now() - 86400000),
    },
    {
      id: 'analytics',
      name: 'Analytics Deep Dive',
      widgets: ['triangle-score', 'performance-metrics', 'recent-activity'],
      isDefault: false,
      lastModified: new Date(Date.now() - 172800000),
    },
  ]);
  const [activeView, setActiveView] = useState('default');
  const [editMode, setEditMode] = useState(false);

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
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);

        return newItems;
      });
    }
  };

  const toggleWidget = (widgetId: string) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    ));
  };

  const saveCurrentView = () => {
    const viewName = prompt('Enter a name for this view:');
    if (viewName) {
      const newView: SavedView = {
        id: Date.now().toString(),
        name: viewName,
        widgets: widgets.filter(w => w.enabled).map(w => w.id),
        isDefault: false,
        lastModified: new Date(),
      };
      setSavedViews([...savedViews, newView]);
    }
  };

  const loadView = (viewId: string) => {
    const view = savedViews.find(v => v.id === viewId);
    if (view) {
      setWidgets(widgets.map(w => ({
        ...w,
        enabled: view.widgets.includes(w.id)
      })));
      setActiveView(viewId);
    }
  };

  const deleteView = (viewId: string) => {
    if (confirm('Are you sure you want to delete this view?')) {
      setSavedViews(savedViews.filter(v => v.id !== viewId));
      if (activeView === viewId) {
        setActiveView('default');
        loadView('default');
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span>🎨</span>
            Dashboard Customization
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={editMode ? "default" : "outline"}
              size="sm"
              onClick={() => setEditMode(!editMode)}
            >
              {editMode ? 'Done Editing' : 'Edit Layout'}
            </Button>
            {editMode && (
              <Button size="sm" onClick={saveCurrentView}>
                Save View
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="widgets" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="widgets">Widget Layout</TabsTrigger>
            <TabsTrigger value="saved">Saved Views</TabsTrigger>
            <TabsTrigger value="settings">View Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="widgets" className="space-y-4">
            <div className="text-sm text-muted-foreground mb-4">
              {editMode ? 'Drag widgets to reorder, click to toggle visibility' : 'Enable edit mode to customize'}
            </div>
            
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
                    <div
                      key={widget.id}
                      className={`relative ${!widget.enabled && editMode ? 'opacity-50' : ''}`}
                    >
                      {editMode ? (
                        <div className="relative">
                          <SortableWidget widget={widget} />
                          <button
                            className="absolute top-2 right-2 p-1 bg-white rounded shadow-sm"
                            onClick={() => toggleWidget(widget.id)}
                          >
                            {widget.enabled ? '👁️' : '👁️‍🗨️'}
                          </button>
                        </div>
                      ) : (
                        widget.enabled && <SortableWidget widget={widget} />
                      )}
                    </div>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            <div className="grid gap-3">
              {savedViews.map((view) => (
                <div
                  key={view.id}
                  className={`
                    p-4 border rounded-lg cursor-pointer transition-all
                    ${activeView === view.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}
                  `}
                  onClick={() => loadView(view.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium flex items-center gap-2">
                        {view.name}
                        {view.isDefault && <Badge variant="secondary">Default</Badge>}
                        {activeView === view.id && <Badge>Active</Badge>}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {view.widgets.length} widgets • Last modified {view.lastModified.toLocaleDateString()}
                      </p>
                    </div>
                    {!view.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteView(view.id);
                        }}
                      >
                        🗑️
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-2">Quick Templates</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">Monitoring Template</Button>
                <Button variant="outline" size="sm">Analytics Template</Button>
                <Button variant="outline" size="sm">Executive Template</Button>
                <Button variant="outline" size="sm">Operations Template</Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Auto-refresh</h4>
                  <p className="text-sm text-muted-foreground">Update dashboard data automatically</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Compact Mode</h4>
                  <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
                </div>
                <input type="checkbox" className="h-5 w-5" />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Show Animations</h4>
                  <p className="text-sm text-muted-foreground">Enable transition effects</p>
                </div>
                <input type="checkbox" defaultChecked className="h-5 w-5" />
              </div>
              
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-2">Refresh Interval</h4>
                <select className="w-full p-2 border rounded">
                  <option>Every 30 seconds</option>
                  <option>Every minute</option>
                  <option>Every 5 minutes</option>
                  <option>Every 15 minutes</option>
                  <option>Manual only</option>
                </select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}