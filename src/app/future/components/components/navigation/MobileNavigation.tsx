'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Menu, X, Home, BarChart3, Upload, Shield, Package, FileText, TrendingUp, Users, Settings, HelpCircle, LogOut } from 'lucide-react';

interface MobileNavigationProps {
  user?: any;
  notifications?: number;
}

export function MobileNavigation({ user, notifications = 0 }: MobileNavigationProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navigationItems = [
    { icon: Home, label: 'Dashboard', href: '/dashboard', badge: null },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics', badge: null },
    { icon: Upload, label: 'Upload Data', href: '/dashboard/upload', badge: null },
    { icon: Shield, label: 'Control Tower', href: '/dashboard/control-tower', badge: notifications },
    { icon: Package, label: 'Inventory', href: '/dashboard/inventory', badge: null },
    { icon: TrendingUp, label: 'Sales', href: '/dashboard/sales', badge: null },
    { icon: Users, label: 'Suppliers', href: '/dashboard/suppliers', badge: null },
    { icon: FileText, label: 'Documents', href: '/dashboard/documents', badge: null },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings', badge: null },
  ];

  const bottomItems = [
    { icon: HelpCircle, label: 'Help & Support', href: '/help' },
    { icon: LogOut, label: 'Logout', href: '/logout' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              <SheetHeader className="p-6 border-b">
                <SheetTitle className="text-xl">Finkargo Analytics</SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col h-full">
                <nav className="flex-1 overflow-y-auto py-4">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`
                        flex items-center gap-3 px-6 py-3 transition-colors
                        ${isActive(item.href) 
                          ? 'bg-accent text-accent-foreground font-medium' 
                          : 'hover:bg-accent/50'
                        }
                      `}
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <Badge variant="default" className="ml-auto">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  ))}
                </nav>
                
                <div className="border-t py-4">
                  {bottomItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 px-6 py-3 hover:bg-accent/50 transition-colors"
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
                
                {user && (
                  <div className="border-t p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm font-medium">
                        {user.name?.[0] || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.name || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
          
          <h1 className="text-lg font-semibold">Finkargo Analytics</h1>
          
          <Button variant="ghost" size="icon">
            <Upload className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background border-t">
        <div className="grid grid-cols-5 gap-1">
          <Link
            href="/dashboard"
            className={`
              flex flex-col items-center gap-1 py-2 px-1 transition-colors
              ${isActive('/dashboard') ? 'text-primary' : 'text-muted-foreground'}
            `}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px]">Home</span>
          </Link>
          
          <Link
            href="/dashboard/analytics"
            className={`
              flex flex-col items-center gap-1 py-2 px-1 transition-colors
              ${isActive('/dashboard/analytics') ? 'text-primary' : 'text-muted-foreground'}
            `}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-[10px]">Analytics</span>
          </Link>
          
          <Link
            href="/dashboard/upload"
            className={`
              flex flex-col items-center gap-1 py-2 px-1 transition-colors
              ${isActive('/dashboard/upload') ? 'text-primary' : 'text-muted-foreground'}
            `}
          >
            <Upload className="h-5 w-5" />
            <span className="text-[10px]">Upload</span>
          </Link>
          
          <Link
            href="/dashboard/control-tower"
            className={`
              flex flex-col items-center gap-1 py-2 px-1 transition-colors relative
              ${isActive('/dashboard/control-tower') ? 'text-primary' : 'text-muted-foreground'}
            `}
          >
            <Shield className="h-5 w-5" />
            <span className="text-[10px]">Agents</span>
            {notifications > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              >
                {notifications}
              </Badge>
            )}
          </Link>
          
          <button
            onClick={() => setOpen(true)}
            className="flex flex-col items-center gap-1 py-2 px-1 text-muted-foreground"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px]">More</span>
          </button>
        </div>
      </div>
    </>
  );
}