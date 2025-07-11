'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  TrendingUp, 
  Shield, 
  Users, 
  FileText, 
  BarChart3,
  Upload,
  Zap,
  Settings,
  PlusCircle
} from 'lucide-react';
import Link from 'next/link';

interface QuickAccessGridProps {
  persona?: 'streamliner' | 'navigator' | 'hub' | 'spring' | 'processor';
}

interface QuickAccessItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  color: string;
  priority?: number;
}

export function QuickAccessGrid({ persona }: QuickAccessGridProps) {
  // Define all available quick access items
  const allItems: QuickAccessItem[] = [
    {
      title: 'Inventory',
      description: 'Track stock levels and movements',
      icon: <Package className="h-6 w-6" />,
      href: '/dashboard/inventory',
      color: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      priority: 1
    },
    {
      title: 'Sales',
      description: 'Monitor revenue and orders',
      icon: <TrendingUp className="h-6 w-6" />,
      href: '/dashboard/sales',
      color: 'bg-green-50 text-green-700 hover:bg-green-100',
      priority: 2
    },
    {
      title: 'Control Tower',
      description: 'Manage agents and automation',
      icon: <Shield className="h-6 w-6" />,
      href: '/dashboard/agents',
      color: 'bg-purple-50 text-purple-700 hover:bg-purple-100',
      priority: 3
    },
    {
      title: 'Suppliers',
      description: 'Vendor performance and scorecards',
      icon: <Users className="h-6 w-6" />,
      href: '/dashboard/suppliers',
      color: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
      priority: 4
    },
    {
      title: 'Documents',
      description: 'Import/export documentation',
      icon: <FileText className="h-6 w-6" />,
      href: '/dashboard/documents',
      color: 'bg-gray-50 text-gray-700 hover:bg-gray-100',
      priority: 5
    },
    {
      title: 'Analytics',
      description: 'Deep insights and reports',
      icon: <BarChart3 className="h-6 w-6" />,
      href: '/dashboard/analytics',
      color: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
      priority: 6
    }
  ];

  // Persona-specific items
  const personaItems: Record<string, QuickAccessItem[]> = {
    streamliner: [
      {
        title: 'Quick Upload',
        description: 'Upload CSV in seconds',
        icon: <Upload className="h-6 w-6" />,
        href: '/dashboard/upload',
        color: 'bg-blue-600 text-white hover:bg-blue-700',
        priority: 0
      },
      {
        title: 'Speed Dashboard',
        description: 'Your performance metrics',
        icon: <Zap className="h-6 w-6" />,
        href: '/dashboard/speed',
        color: 'bg-yellow-500 text-white hover:bg-yellow-600',
        priority: 0
      }
    ],
    navigator: [
      {
        title: 'Settings',
        description: 'Customize your experience',
        icon: <Settings className="h-6 w-6" />,
        href: '/dashboard/settings',
        color: 'bg-gray-600 text-white hover:bg-gray-700',
        priority: 0
      }
    ],
    hub: [
      {
        title: 'Add Entity',
        description: 'Expand your network',
        icon: <PlusCircle className="h-6 w-6" />,
        href: '/dashboard/entities/new',
        color: 'bg-purple-600 text-white hover:bg-purple-700',
        priority: 0
      }
    ],
    spring: []
  };

  // Get items based on persona
  const getItemsForPersona = () => {
    const baseItems = [...allItems];
    const specificItems = persona ? personaItems[persona] || [] : [];
    
    // Combine and sort by priority
    const combined = [...specificItems, ...baseItems];
    
    // For streamliners, limit to 6 most important items
    if (persona === 'streamliner') {
      return combined.slice(0, 6);
    }
    
    // For springs, show only the most essential items
    if (persona === 'spring') {
      return baseItems.filter(item => [1, 2, 3, 6].includes(item.priority || 0));
    }
    
    return combined.slice(0, 8);
  };

  const items = getItemsForPersona();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Quick Access</h2>
          <p className="text-sm text-gray-600">
            {persona === 'streamliner' ? 'Your fastest routes' : 'Navigate to key areas'}
          </p>
        </div>
        
        <div className={`grid gap-4 ${
          persona === 'streamliner' 
            ? 'grid-cols-2 md:grid-cols-3' 
            : 'grid-cols-2 md:grid-cols-4'
        }`}>
          {items.map((item, index) => (
            <Link key={index} href={item.href}>
              <Button
                variant="ghost"
                className={`h-auto flex-col p-4 space-y-2 ${item.color} border transition-all hover:scale-105`}
              >
                {item.icon}
                <div className="text-center">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs opacity-80">{item.description}</p>
                </div>
              </Button>
            </Link>
          ))}
        </div>

        {persona === 'streamliner' && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Press <kbd className="px-2 py-1 text-xs bg-gray-100 rounded">⌘K</kbd> for command palette
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}