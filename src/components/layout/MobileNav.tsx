'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
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
  X
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
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
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      title: 'Upload Data',
      href: '/dashboard/upload',
      icon: <Upload className="h-5 w-5" />
    },
    {
      title: 'Control Tower',
      href: '/dashboard/agents',
      icon: <Shield className="h-5 w-5" />,
      badge: '3'
    },
    {
      title: 'Inventory',
      href: '/dashboard/inventory',
      icon: <Package className="h-5 w-5" />
    },
    {
      title: 'Sales',
      href: '/dashboard/sales',
      icon: <TrendingUp className="h-5 w-5" />
    },
    {
      title: 'Suppliers',
      href: '/dashboard/suppliers',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Documents',
      href: '/dashboard/documents',
      icon: <FileText className="h-5 w-5" />
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
    <>
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="-ml-2">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open navigation menu</span>
            </Button>
          </SheetTrigger>
          
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle>Finkargo Analytics</SheetTitle>
            </SheetHeader>
            
            <div className="flex h-full flex-col">
              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto py-6">
                <div className="space-y-1 px-3">
                  {navigation.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:text-gray-900 hover:bg-gray-100',
                        isActive(item.href) && 'bg-gray-100 text-gray-900 font-medium'
                      )}
                    >
                      {item.icon}
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-medium text-white">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Bottom Navigation */}
              <div className="border-t p-3">
                {bottomNavigation.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 transition-all hover:text-gray-900 hover:bg-gray-100"
                  >
                    {item.icon}
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>

              {/* User Info */}
              <div className="border-t p-4">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-medium">
                    U
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">User Name</p>
                    <p className="text-xs text-gray-500">user@example.com</p>
                  </div>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 items-center justify-between">
          <h1 className="text-lg font-semibold">Finkargo Analytics</h1>
          
          {/* Quick Actions for Mobile */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Upload className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}