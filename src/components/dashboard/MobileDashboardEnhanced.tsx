'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Package, 
  TrendingUp, 
  Shield, 
  FileText, 
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useTouchGestures, usePinchZoom } from '@/hooks/useTouchGestures';
import { MobileQuickAccess } from './MobileQuickAccess';
import { SupplyChainTriangleOverview } from './SupplyChainTriangleOverview';
import { RecentActivity } from './RecentActivity';
import { toast } from '@/components/ui/use-toast';
import type { Profile, Company } from '@/types';

interface MobileDashboardEnhancedProps {
  user: Profile;
  company: Company;
  recentActivity: any[];
  metrics: any;
}

interface DashboardView {
  id: string;
  title: string;
  icon: any;
  component: React.ReactNode;
}

export function MobileDashboardEnhanced({ 
  user, 
  company, 
  recentActivity, 
  metrics 
}: MobileDashboardEnhancedProps) {
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewTransition, setViewTransition] = useState<'left' | 'right' | null>(null);

  const views: DashboardView[] = [
    {
      id: 'quick-access',
      title: 'Quick Access',
      icon: Package,
      component: <MobileQuickAccess />
    },
    {
      id: 'supply-chain',
      title: 'Supply Chain',
      icon: BarChart3,
      component: <SupplyChainTriangleOverview compact={true} />
    },
    {
      id: 'activity',
      title: 'Recent Activity',
      icon: FileText,
      component: <RecentActivity activities={recentActivity} compact={true} />
    },
    {
      id: 'metrics',
      title: 'Key Metrics',
      icon: TrendingUp,
      component: <MobileMetricsView metrics={metrics} />
    }
  ];

  const currentView = views[currentViewIndex];

  // Handle swipe gestures
  const swipeRef = useTouchGestures({
    onSwipeLeft: () => {
      if (currentViewIndex < views.length - 1) {
        setViewTransition('left');
        setCurrentViewIndex(prev => prev + 1);
      }
    },
    onSwipeRight: () => {
      if (currentViewIndex > 0) {
        setViewTransition('right');
        setCurrentViewIndex(prev => prev - 1);
      }
    }
  });

  // Handle pinch zoom for fullscreen
  const pinchRef = usePinchZoom(
    () => setIsFullscreen(true),
    () => setIsFullscreen(false)
  );

  // Clear transition after animation
  useEffect(() => {
    if (viewTransition) {
      const timer = setTimeout(() => setViewTransition(null), 300);
      return () => clearTimeout(timer);
    }
  }, [viewTransition]);

  // Handle keyboard navigation (for testing)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentViewIndex > 0) {
        setViewTransition('right');
        setCurrentViewIndex(prev => prev - 1);
      } else if (e.key === 'ArrowRight' && currentViewIndex < views.length - 1) {
        setViewTransition('left');
        setCurrentViewIndex(prev => prev + 1);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentViewIndex, views.length]);

  return (
    <div 
      ref={(el) => {
        if (el) {
          swipeRef.current = el;
          pinchRef.current = el;
        }
      }}
      className={`
        min-h-screen bg-gray-50 transition-all duration-300
        ${isFullscreen ? 'fixed inset-0 z-50' : ''}
      `}
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (currentViewIndex > 0) {
                  setViewTransition('right');
                  setCurrentViewIndex(prev => prev - 1);
                }
              }}
              disabled={currentViewIndex === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <div>
              <h1 className="text-lg font-semibold">{currentView.title}</h1>
              <p className="text-xs text-muted-foreground">
                Hello, {user.first_name} 👋
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (currentViewIndex < views.length - 1) {
                  setViewTransition('left');
                  setCurrentViewIndex(prev => prev + 1);
                }
              }}
              disabled={currentViewIndex === views.length - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* View Progress Indicator */}
        <div className="px-4 pb-2">
          <Progress 
            value={(currentViewIndex + 1) / views.length * 100} 
            className="h-1"
          />
          <div className="flex justify-between mt-1">
            {views.map((view, index) => (
              <button
                key={view.id}
                onClick={() => {
                  setViewTransition(index > currentViewIndex ? 'left' : 'right');
                  setCurrentViewIndex(index);
                }}
                className={`
                  text-xs px-1 py-0.5 rounded transition-all
                  ${index === currentViewIndex 
                    ? 'text-primary font-medium' 
                    : 'text-muted-foreground'
                  }
                `}
              >
                {view.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area with Swipe Animation */}
      <div className="relative overflow-hidden">
        <div
          className={`
            transition-transform duration-300 ease-out
            ${viewTransition === 'left' ? '-translate-x-full' : ''}
            ${viewTransition === 'right' ? 'translate-x-full' : ''}
          `}
        >
          <ScrollArea className="h-[calc(100vh-120px)]">
            <div className="p-4">
              {currentView.component}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Bottom Navigation Dots */}
      <div className="fixed bottom-4 left-0 right-0 flex justify-center gap-2 pointer-events-none">
        {views.map((_, index) => (
          <div
            key={index}
            className={`
              w-2 h-2 rounded-full transition-all duration-300
              ${index === currentViewIndex 
                ? 'w-8 bg-primary' 
                : 'bg-gray-300'
              }
            `}
          />
        ))}
      </div>

      {/* Swipe Hint (shown once) */}
      <SwipeHint />
    </div>
  );
}

// Mobile Metrics View Component
function MobileMetricsView({ metrics }: { metrics: any }) {
  const metricCards = [
    {
      title: 'Total Inventory',
      value: '$1.2M',
      change: '+12%',
      icon: Package,
      color: 'blue'
    },
    {
      title: 'Monthly Sales',
      value: '$450K',
      change: '+8%',
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'Active Agents',
      value: '5',
      change: '0',
      icon: Shield,
      color: 'purple'
    },
    {
      title: 'Efficiency Score',
      value: '87%',
      change: '+3%',
      icon: BarChart3,
      color: 'amber'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {metricCards.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardContent className="p-4">
              <div className={`
                absolute top-0 right-0 w-24 h-24 rounded-full -mr-12 -mt-12 opacity-10
                ${metric.color === 'blue' ? 'bg-blue-500' :
                  metric.color === 'green' ? 'bg-green-500' :
                  metric.color === 'purple' ? 'bg-purple-500' :
                  'bg-amber-500'}
              `} />
              
              <metric.icon className={`
                h-5 w-5 mb-2
                ${metric.color === 'blue' ? 'text-blue-600' :
                  metric.color === 'green' ? 'text-green-600' :
                  metric.color === 'purple' ? 'text-purple-600' :
                  'text-amber-600'}
              `} />
              
              <p className="text-xs text-muted-foreground">{metric.title}</p>
              <p className="text-xl font-bold mt-1">{metric.value}</p>
              <p className={`
                text-xs mt-1
                ${metric.change.startsWith('+') ? 'text-green-600' : 'text-gray-600'}
              `}>
                {metric.change} vs last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Chart visualization</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Swipe Hint Component
function SwipeHint() {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const hasSeenHint = localStorage.getItem('mobile-swipe-hint-seen');
    if (!hasSeenHint) {
      setShowHint(true);
      const timer = setTimeout(() => {
        setShowHint(false);
        localStorage.setItem('mobile-swipe-hint-seen', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showHint) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-white rounded-lg p-6 mx-8 animate-fade-in">
        <p className="text-center mb-4">Swipe left or right to navigate</p>
        <div className="flex items-center justify-center gap-4">
          <ChevronLeft className="h-6 w-6 animate-pulse" />
          <div className="w-16 h-1 bg-primary rounded-full" />
          <ChevronRight className="h-6 w-6 animate-pulse" />
        </div>
      </div>
    </div>
  );
}