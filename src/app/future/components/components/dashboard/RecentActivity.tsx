'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Package,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';

interface Activity {
  id: string;
  type: 'upload' | 'alert' | 'success' | 'processing' | 'inventory' | 'sales' | 'supplier' | 'document';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
}

interface RecentActivityProps {
  activities: any[];
  compact?: boolean;
}

export function RecentActivity({ activities, compact = false }: RecentActivityProps) {
  // Mock activities if none provided
  const mockActivities: Activity[] = [
    {
      id: '1',
      type: 'upload',
      title: 'CSV Upload Complete',
      description: '2,450 inventory records processed',
      timestamp: '2 minutes ago',
      user: 'System'
    },
    {
      id: '2',
      type: 'alert',
      title: 'Low Stock Alert',
      description: 'SKU-12345 below reorder point',
      timestamp: '15 minutes ago',
      user: 'Inventory Agent'
    },
    {
      id: '3',
      type: 'success',
      title: 'Optimization Complete',
      description: 'Saved $12,500 in inventory costs',
      timestamp: '1 hour ago',
      user: 'Optimization Engine'
    },
    {
      id: '4',
      type: 'processing',
      title: 'Report Generation',
      description: 'Monthly analytics report in progress',
      timestamp: '2 hours ago',
      user: 'Report Agent'
    },
    {
      id: '5',
      type: 'sales',
      title: 'New Order Received',
      description: 'Order #4521 - $45,000',
      timestamp: '3 hours ago',
      user: 'Sales System'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : mockActivities;
  const itemsToShow = compact ? 5 : 10;

  const getActivityIcon = (type: Activity['type']) => {
    const icons = {
      upload: <Upload className="h-4 w-4" />,
      alert: <AlertCircle className="h-4 w-4" />,
      success: <CheckCircle className="h-4 w-4" />,
      processing: <Clock className="h-4 w-4" />,
      inventory: <Package className="h-4 w-4" />,
      sales: <TrendingUp className="h-4 w-4" />,
      supplier: <Users className="h-4 w-4" />,
      document: <FileText className="h-4 w-4" />
    };
    return icons[type] || <Clock className="h-4 w-4" />;
  };

  const getActivityColor = (type: Activity['type']) => {
    const colors = {
      upload: 'text-blue-600 bg-blue-50',
      alert: 'text-amber-600 bg-amber-50',
      success: 'text-green-600 bg-green-50',
      processing: 'text-gray-600 bg-gray-50',
      inventory: 'text-purple-600 bg-purple-50',
      sales: 'text-emerald-600 bg-emerald-50',
      supplier: 'text-indigo-600 bg-indigo-50',
      document: 'text-slate-600 bg-slate-50'
    };
    return colors[type] || 'text-gray-600 bg-gray-50';
  };

  return (
    <Card className={compact ? 'h-full' : ''}>
      <CardHeader className={compact ? 'pb-3' : ''}>
        <CardTitle className={compact ? 'text-lg' : ''}>Recent Activity</CardTitle>
        {!compact && (
          <CardDescription>
            Track all system activities and updates
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className={compact ? 'px-4' : ''}>
        <ScrollArea className={compact ? 'h-[300px]' : 'h-[400px]'}>
          <div className="space-y-3">
            {displayActivities.slice(0, itemsToShow).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 pb-3 border-b last:border-0 last:pb-0"
              >
                <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{activity.title}</p>
                    {!compact && activity.user && (
                      <Badge variant="outline" className="text-xs">
                        {activity.user}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}