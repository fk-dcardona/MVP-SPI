'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Package, TrendingUp, Users, Shield, FileText, BarChart3, Upload, Plus } from 'lucide-react';
import Link from 'next/link';

interface QuickAccessItem {
  icon: any;
  label: string;
  href: string;
  count?: string;
  badge?: number;
  color?: string;
}

export function MobileQuickAccess() {
  const items: QuickAccessItem[] = [
    { icon: Upload, label: 'Upload', href: '/dashboard/upload', color: 'blue' },
    { icon: Package, label: 'Inventory', href: '/dashboard/inventory', count: '1,234' },
    { icon: TrendingUp, label: 'Sales', href: '/dashboard/sales', count: '$45K' },
    { icon: Shield, label: 'Agents', href: '/dashboard/control-tower', badge: 3, color: 'purple' },
    { icon: Users, label: 'Suppliers', href: '/dashboard/suppliers', count: '24' },
    { icon: FileText, label: 'Documents', href: '/dashboard/documents', count: '156' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', color: 'green' },
  ];

  return (
    <div className="space-y-4">
      {/* Quick Upload CTA */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Quick Upload</h3>
              <p className="text-xs text-muted-foreground">Import your CSV data instantly</p>
            </div>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-1" />
              Upload
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Grid View */}
      <div className="grid grid-cols-3 gap-3">
        {items.slice(0, 6).map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="relative h-full hover:shadow-md transition-shadow">
              <CardContent className="p-3 text-center">
                <div className={`
                  w-10 h-10 mx-auto mb-2 rounded-lg flex items-center justify-center
                  ${item.color === 'blue' ? 'bg-blue-100 text-blue-700' : 
                    item.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                    item.color === 'green' ? 'bg-green-100 text-green-700' :
                    'bg-accent text-accent-foreground'}
                `}>
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium truncate">{item.label}</p>
                {item.count && (
                  <p className="text-xs text-muted-foreground">{item.count}</p>
                )}
                {item.badge && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[10px] font-bold">
                    {item.badge}
                  </div>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Horizontal Scroll View Alternative */}
      <div>
        <h3 className="text-sm font-semibold mb-2">All Features</h3>
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {items.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="min-w-[100px] hover:shadow-md transition-shadow">
                  <CardContent className="p-3 text-center">
                    <item.icon className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs font-medium">{item.label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
            <Card className="min-w-[100px] border-dashed">
              <CardContent className="p-3 text-center">
                <Plus className="h-6 w-6 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs font-medium">More</p>
              </CardContent>
            </Card>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}