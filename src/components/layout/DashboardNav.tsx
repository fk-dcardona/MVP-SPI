'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  LayoutDashboard,
  Package,
  TrendingUp,
  Shield,
  Users,
  FileText,
  BarChart3,
  Upload,
  Settings,
  LogOut,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  children?: NavItem[];
}

export function DashboardNav() {
  const pathname = usePathname();

  const navigation: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      title: 'Analytics',
      href: '/dashboard/analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      children: [
        { title: 'Inventory', href: '/dashboard/analytics#inventory', icon: <Package className="h-4 w-4" /> },
        { title: 'Sales', href: '/dashboard/analytics#sales', icon: <TrendingUp className="h-4 w-4" /> },
        { title: 'Financial', href: '/dashboard/analytics#financial', icon: <FileText className="h-4 w-4" /> },
        { title: 'Suppliers', href: '/dashboard/analytics#suppliers', icon: <Users className="h-4 w-4" /> }
      ]
    },
    {
      title: 'Operations',
      href: '#',
      icon: <Package className="h-5 w-5" />,
      children: [
        { title: 'Upload Data', href: '/dashboard/upload', icon: <Upload className="h-4 w-4" /> },
        { title: 'Inventory', href: '/dashboard/inventory', icon: <Package className="h-4 w-4" /> },
        { title: 'Sales', href: '/dashboard/sales', icon: <TrendingUp className="h-4 w-4" /> },
        { title: 'Documents', href: '/dashboard/documents', icon: <FileText className="h-4 w-4" /> }
      ]
    },
    {
      title: 'Control Tower',
      href: '/dashboard/agents',
      icon: <Shield className="h-5 w-5" />,
      badge: '3'
    },
    {
      title: 'Suppliers',
      href: '/dashboard/suppliers',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: <Settings className="h-5 w-5" />
    }
  ];

  const bottomNavigation = [
    {
      title: 'Help & Support',
      href: '/dashboard/help',
      icon: <HelpCircle className="h-5 w-5" />
    },
    {
      title: 'Logout',
      href: '/logout',
      icon: <LogOut className="h-5 w-5" />
    }
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    if (href !== '/dashboard' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center px-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white">Finkargo Analytics</h1>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-6">
        <nav className="flex flex-col gap-1 px-3">
          {navigation.map((item) => (
            <div key={item.title}>
              <Link
                href={item.href !== '#' ? item.href : '#'}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800',
                  isActive(item.href) && 'bg-gray-800 text-white'
                )}
              >
                {item.icon}
                <span className="flex-1">{item.title}</span>
                {item.badge && (
                  <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                    {item.badge}
                  </span>
                )}
                {item.children && (
                  <ChevronRight className="h-4 w-4 ml-auto" />
                )}
              </Link>
              
              {/* Submenu */}
              {item.children && isActive(item.href) && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.children.map((child) => (
                    <Link
                      key={child.title}
                      href={child.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-1.5 text-sm text-gray-400 transition-all hover:text-white hover:bg-gray-800',
                        pathname === child.href && 'bg-gray-800 text-white'
                      )}
                    >
                      {child.icon}
                      <span>{child.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-800 p-3">
        {bottomNavigation.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-300 transition-all hover:text-white hover:bg-gray-800"
          >
            {item.icon}
            <span>{item.title}</span>
          </Link>
        ))}
      </div>

      {/* User Info */}
      <div className="border-t border-gray-800 p-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-medium">
            U
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-white">User Name</p>
            <p className="text-xs text-gray-400">user@example.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}