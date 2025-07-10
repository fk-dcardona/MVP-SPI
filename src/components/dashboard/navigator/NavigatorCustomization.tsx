'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select-radix';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  closestCenter
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Save, Trash2, Star, StarOff, Eye, EyeOff, GripVertical } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface Widget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  enabled: boolean;
  order: number;
}

interface SavedView {
  id: string;
  name: string;
  widgets: Widget[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const defaultWidgets: Widget[] = [
  { id: 'system-health', type: 'health', title: 'System Health Overview', size: 'medium', enabled: true, order: 0 },
  { id: 'quick-controls', type: 'controls', title: 'Quick Controls', size: 'small', enabled: true, order: 1 },
  { id: 'triangle-score', type: 'triangle', title: 'Supply Chain Triangle', size: 'medium', enabled: true, order: 2 },
  { id: 'recent-activity', type: 'activity', title: 'Recent Activity', size: 'large', enabled: true, order: 3 },
  { id: 'alerts-panel', type: 'alerts', title: 'Alerts & Notifications', size: 'medium', enabled: false, order: 4 },
  { id: 'performance-metrics', type: 'metrics', title: 'Performance Metrics', size: 'large', enabled: false, order: 5 },
  { id: 'data-quality', type: 'quality', title: 'Data Quality Monitor', size: 'small', enabled: false, order: 6 },
  { id: 'agent-status', type: 'agents', title: 'Agent Status Board', size: 'medium', enabled: false, order: 7 },
];

// Load saved views from localStorage
const loadSavedViews = (): SavedView[] => {
  if (typeof window === 'undefined') return [];
  const saved = localStorage.getItem('navigator-saved-views');
  if (saved) {
    return JSON.parse(saved).map((v: any) => ({
      ...v,
      createdAt: new Date(v.createdAt),
      updatedAt: new Date(v.updatedAt),
    }));
  }
  return [
    {
      id: 'default',
      name: 'Default View',
      widgets: defaultWidgets,
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
};

// Save views to localStorage
const persistViews = (views: SavedView[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('navigator-saved-views', JSON.stringify(views));
  }
};

function SortableWidget({ widget, editMode }: { widget: Widget; editMode: boolean }) {
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

  const sizeClasses = {
    small: 'col-span-1',
    medium: 'col-span-2',
    large: 'col-span-3',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative p-4 border rounded-lg bg-white transition-all
        ${isDragging ? 'shadow-lg z-10' : 'shadow-sm'}
        ${sizeClasses[widget.size]}
        ${!widget.enabled && editMode ? 'opacity-50' : ''}
        ${editMode ? 'cursor-move' : ''}
      `}
    >
      {editMode && (
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 cursor-move"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
      
      <div className={editMode ? 'ml-6' : ''}>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">{widget.title}</h4>
          <div className="flex items-center gap-2">
            <Badge variant={widget.enabled ? "default" : "secondary"}>
              {widget.enabled ? 'Active' : 'Inactive'}
            </Badge>
            {editMode && (
              <Badge variant="outline">{widget.size}</Badge>
            )}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Widget ID: {widget.id}
        </div>
      </div>
    </div>
  );
}

export function NavigatorCustomization() {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeViewId, setActiveViewId] = useState('default');
  const [editMode, setEditMode] = useState(false);
  const [viewName, setViewName] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  // Load saved views on mount
  useEffect(() => {
    const views = loadSavedViews();
    setSavedViews(views);
    const defaultView = views.find(v => v.isDefault) || views[0];
    if (defaultView) {
      setWidgets(defaultView.widgets);
      setActiveViewId(defaultView.id);
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Update order property
        return newOrder.map((item, index) => ({ ...item, order: index }));
      });
    }
  };

  const toggleWidget = (widgetId: string) => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, enabled: !w.enabled } : w
    ));
  };

  const changeWidgetSize = (widgetId: string, size: 'small' | 'medium' | 'large') => {
    setWidgets(widgets.map(w => 
      w.id === widgetId ? { ...w, size } : w
    ));
  };

  const saveCurrentView = () => {
    if (!viewName.trim()) {
      toast({
        title: 'View name required',
        description: 'Please enter a name for the view.',
        variant: 'destructive',
      });
      return;
    }

    const newView: SavedView = {
      id: `view-${Date.now()}`,
      name: viewName.trim(),
      widgets: [...widgets],
      isDefault: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedViews = [...savedViews, newView];
    setSavedViews(updatedViews);
    persistViews(updatedViews);
    setViewName('');
    
    toast({
      title: 'View saved',
      description: `"${newView.name}" has been saved successfully.`,
    });
  };

  const loadView = (viewId: string) => {
    const view = savedViews.find(v => v.id === viewId);
    if (view) {
      setWidgets([...view.widgets]);
      setActiveViewId(viewId);
      toast({
        title: 'View loaded',
        description: `Switched to "${view.name}" view.`,
      });
    }
  };

  const updateView = (viewId: string) => {
    const updatedViews = savedViews.map(v => 
      v.id === viewId 
        ? { ...v, widgets: [...widgets], updatedAt: new Date() }
        : v
    );
    setSavedViews(updatedViews);
    persistViews(updatedViews);
    
    toast({
      title: 'View updated',
      description: 'Current layout has been saved to the view.',
    });
  };

  const deleteView = (viewId: string) => {
    if (viewId === 'default') {
      toast({
        title: 'Cannot delete default view',
        description: 'The default view cannot be deleted.',
        variant: 'destructive',
      });
      return;
    }

    const updatedViews = savedViews.filter(v => v.id !== viewId);
    setSavedViews(updatedViews);
    persistViews(updatedViews);
    
    if (activeViewId === viewId) {
      const defaultView = updatedViews.find(v => v.isDefault) || updatedViews[0];
      if (defaultView) {
        loadView(defaultView.id);
      }
    }
    
    toast({
      title: 'View deleted',
      description: 'The saved view has been removed.',
    });
  };

  const setDefaultView = (viewId: string) => {
    const updatedViews = savedViews.map(v => ({ 
      ...v, 
      isDefault: v.id === viewId 
    }));
    setSavedViews(updatedViews);
    persistViews(updatedViews);
    
    toast({
      title: 'Default view set',
      description: 'This view will load automatically next time.',
    });
  };

  const activeWidget = activeId ? widgets.find(w => w.id === activeId) : null;

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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="widgets" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="widgets">Widget Layout</TabsTrigger>
            <TabsTrigger value="saved">Saved Views</TabsTrigger>
            <TabsTrigger value="settings">Widget Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="widgets" className="space-y-4">
            {/* Current View Selector */}
            <div className="flex items-center gap-4 pb-4 border-b">
              <div className="flex-1">
                <Label htmlFor="current-view">Current View</Label>
                <Select value={activeViewId} onValueChange={loadView}>
                  <SelectTrigger id="current-view">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {savedViews.map((view) => (
                      <SelectItem key={view.id} value={view.id}>
                        <div className="flex items-center gap-2">
                          {view.isDefault && <Star className="h-3 w-3" />}
                          <span>{view.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editMode && activeViewId !== 'default' && (
                <Button
                  size="sm"
                  onClick={() => updateView(activeViewId)}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update View
                </Button>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {editMode 
                ? 'Drag widgets to reorder, use toggles to show/hide'
                : 'Enable edit mode to customize your dashboard'}
            </div>
            
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={widgets.map(w => w.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="grid grid-cols-3 gap-4">
                  {widgets
                    .filter(w => editMode || w.enabled)
                    .map((widget) => (
                      <SortableWidget 
                        key={widget.id} 
                        widget={widget} 
                        editMode={editMode}
                      />
                    ))}
                </div>
              </SortableContext>
              
              <DragOverlay>
                {activeWidget && (
                  <div className="p-4 border rounded-lg bg-white shadow-lg opacity-90">
                    <h4 className="font-medium">{activeWidget.title}</h4>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </TabsContent>

          <TabsContent value="saved" className="space-y-4">
            {/* Save New View */}
            <div className="p-4 border rounded-lg bg-muted/30">
              <Label htmlFor="new-view-name">Create New View</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="new-view-name"
                  placeholder="Enter view name"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && saveCurrentView()}
                />
                <Button onClick={saveCurrentView} disabled={!viewName.trim()}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Current Layout
                </Button>
              </div>
            </div>

            {/* Saved Views List */}
            <div className="space-y-2">
              {savedViews.map((view) => (
                <div
                  key={view.id}
                  className={`
                    p-4 border rounded-lg transition-all cursor-pointer
                    ${activeViewId === view.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}
                  `}
                  onClick={() => loadView(view.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{view.name}</h4>
                        {view.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                        {activeViewId === view.id && (
                          <Badge className="text-xs">Active</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{view.widgets.filter(w => w.enabled).length} active widgets</span>
                        <span>•</span>
                        <span>Updated {view.updatedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {!view.isDefault && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDefaultView(view.id)}
                          >
                            <StarOff className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteView(view.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Templates */}
            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Quick Templates</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const monitoringWidgets = widgets.map(w => ({
                      ...w,
                      enabled: ['system-health', 'agent-status', 'data-quality', 'alerts-panel'].includes(w.id)
                    }));
                    setWidgets(monitoringWidgets);
                    toast({
                      title: 'Template applied',
                      description: 'Monitoring template has been applied.',
                    });
                  }}
                >
                  📊 Monitoring Focus
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const analyticsWidgets = widgets.map(w => ({
                      ...w,
                      enabled: ['triangle-score', 'performance-metrics', 'recent-activity'].includes(w.id)
                    }));
                    setWidgets(analyticsWidgets);
                    toast({
                      title: 'Template applied',
                      description: 'Analytics template has been applied.',
                    });
                  }}
                >
                  📈 Analytics Deep Dive
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {editMode ? (
              <div className="space-y-4">
                {widgets.map((widget) => (
                  <div key={widget.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{widget.title}</h4>
                      <Switch
                        checked={widget.enabled}
                        onCheckedChange={() => toggleWidget(widget.id)}
                      />
                    </div>
                    
                    {widget.enabled && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`size-${widget.id}`}>Size:</Label>
                        <Select
                          value={widget.size}
                          onValueChange={(size: 'small' | 'medium' | 'large') => 
                            changeWidgetSize(widget.id, size)
                          }
                        >
                          <SelectTrigger id={`size-${widget.id}`} className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Small</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="large">Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Enable edit mode to configure widget settings
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}