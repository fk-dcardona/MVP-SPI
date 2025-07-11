'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  Package,
  TrendingDown,
  DollarSign,
  Truck,
  X
} from 'lucide-react';
import { useAlertsRealtime } from '@/hooks/useRealtime';
import { useAuth } from '@/hooks/useAuth';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  data?: any;
  acknowledged: boolean;
  created_at: string;
}

export function NotificationCenter() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');
  const { company, userProfile } = useAuth();
  const supabase = createClientComponentClient();

  // Load initial alerts
  useEffect(() => {
    if (company?.id) {
      loadAlerts();
    }
  }, [company?.id]);

  // Subscribe to real-time alerts
  useAlertsRealtime((payload) => {
    console.log('New alert:', payload);
    if (payload.eventType === 'INSERT') {
      const newAlert = payload.new as Alert;
      setAlerts(prev => [newAlert, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(newAlert.title, {
          body: newAlert.message,
          icon: '/icon-192x192.png',
          tag: newAlert.id,
        });
      }
    } else if (payload.eventType === 'UPDATE') {
      const updatedAlert = payload.new as Alert;
      setAlerts(prev => prev.map(alert => 
        alert.id === updatedAlert.id ? updatedAlert : alert
      ));
      if (updatedAlert.acknowledged && !payload.old?.acknowledged) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  });

  const loadAlerts = async () => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('company_id', company?.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setAlerts(data);
      setUnreadCount(data.filter(alert => !alert.acknowledged).length);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('alerts')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userProfile?.id
      })
      .eq('id', alertId);

    if (!error) {
      setAlerts(prev => prev.map(alert => 
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const acknowledgeAll = async () => {
    const unacknowledgedIds = alerts
      .filter(alert => !alert.acknowledged)
      .map(alert => alert.id);

    if (unacknowledgedIds.length === 0) return;

    const { error } = await supabase
      .from('alerts')
      .update({
        acknowledged: true,
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: userProfile?.id
      })
      .in('id', unacknowledgedIds);

    if (!error) {
      setAlerts(prev => prev.map(alert => ({ ...alert, acknowledged: true })));
      setUnreadCount(0);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'inventory_alert':
        return <Package className="h-4 w-4" />;
      case 'stockout':
        return <AlertTriangle className="h-4 w-4" />;
      case 'price_change':
        return <DollarSign className="h-4 w-4" />;
      case 'delivery':
        return <Truck className="h-4 w-4" />;
      case 'low_stock':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredAlerts = filter === 'unread' 
    ? alerts.filter(alert => !alert.acknowledged)
    : alerts;

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
          <SheetDescription>
            Stay updated with your supply chain alerts
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="unread">
                  Unread ({unreadCount})
                </TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={acknowledgeAll}
                  className="text-xs"
                >
                  Mark all as read
                </Button>
              )}
            </div>

            <ScrollArea className="h-[calc(100vh-200px)]">
              <div className="space-y-2">
                {filteredAlerts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>{filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</p>
                  </div>
                ) : (
                  filteredAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors",
                        alert.acknowledged 
                          ? "bg-gray-50 border-gray-200" 
                          : "bg-white border-blue-200"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          getSeverityColor(alert.severity)
                        )}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-sm">{alert.title}</h4>
                            {!alert.acknowledged && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -mr-1"
                                onClick={() => acknowledgeAlert(alert.id)}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}