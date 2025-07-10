'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Package, 
  TrendingUp, 
  Users, 
  FileText, 
  AlertCircle,
  Upload,
  Zap,
  Clock,
  Target
} from 'lucide-react';
import { QuickAccessGrid } from './QuickAccessGrid';
import { SupplyChainTriangleOverview } from './SupplyChainTriangleOverview';
import { RecentActivity } from './RecentActivity';
import { PersonaDetector } from './PersonaDetector';
import { StreamlinerQuickActions } from './StreamlinerQuickActions';
import { NavigatorControlPanel } from './NavigatorControlPanel';
import { NavigatorDashboard } from './NavigatorDashboard';
import { MobileDashboard } from './MobileDashboard';
import { MobileDashboardEnhanced } from './MobileDashboardEnhanced';
import { EntitySwitcher } from '@/components/hub/EntitySwitcher';
import { OnboardingWizard } from '@/components/spring/OnboardingWizard';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import type { Profile, Company } from '@/types';

interface MainDashboardProps {
  user: Profile;
  company: Company;
  recentActivity: any[];
  metrics: any;
}

type UserPersona = 'streamliner' | 'navigator' | 'hub' | 'spring' | 'processor';

export function MainDashboard({ user, company, recentActivity, metrics }: MainDashboardProps) {
  const [detectedPersona, setDetectedPersona] = useState<UserPersona | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Enable keyboard shortcuts (desktop only)
  useKeyboardShortcuts();

  useEffect(() => {
    // Detect user persona based on behavior patterns
    const detectPersona = async () => {
      const persona = await PersonaDetector.detect(user, company);
      setDetectedPersona(persona);
      setIsLoading(false);
    };
    
    detectPersona();
  }, [user, company]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Personalizing your experience...</p>
        </div>
      </div>
    );
  }

  // Render mobile dashboard if on mobile device
  if (isMobile) {
    // Use enhanced mobile dashboard for better touch experience
    return <MobileDashboardEnhanced user={user} company={company} recentActivity={recentActivity} metrics={metrics} />;
  }

  // Render persona-specific dashboard for desktop
  switch (detectedPersona) {
    case 'streamliner':
      return <StreamlinerDashboard {...{ user, company, recentActivity, metrics }} />;
    case 'navigator':
      return <NavigatorDashboard {...{ user, company, recentActivity, metrics }} />;
    case 'hub':
      return <HubDashboard {...{ user, company, recentActivity, metrics }} />;
    case 'spring':
      return <SpringDashboard {...{ user, company, recentActivity, metrics }} />;
    default:
      return <DefaultDashboard {...{ user, company, recentActivity, metrics }} />;
  }
}

// Streamliner Dashboard - Speed focused
function StreamlinerDashboard({ user, company, recentActivity, metrics }: MainDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Speed Metrics Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Zap className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-900">Speed Mode Active</p>
              <p className="text-xs text-blue-700">All shortcuts enabled • Press ⌘K for commands</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-900">2.3s</p>
              <p className="text-xs text-blue-700">Avg. task time</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">↓ 47%</p>
              <p className="text-xs text-gray-600">vs last week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions for Streamliners */}
      <StreamlinerQuickActions />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Quick Access */}
        <div className="lg:col-span-2 space-y-6">
          <QuickAccessGrid persona="streamliner" />
          
          {/* Supply Chain Triangle */}
          <SupplyChainTriangleOverview compact={true} />
        </div>

        {/* Right Column - Activity Feed */}
        <div className="space-y-6">
          <RecentActivity activities={recentActivity} compact={true} />
          
          {/* Speed Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5" />
                Today&apos;s Wins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Tasks completed</span>
                  <span className="font-bold text-green-600">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Time saved</span>
                  <span className="font-bold text-blue-600">3.2 hrs</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Speed rank</span>
                  <span className="font-bold text-purple-600">#2 🏆</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


// Hub Dashboard - Network focused
function HubDashboard({ user, company, recentActivity, metrics }: MainDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Multi-Entity Switcher */}
      <EntitySwitcher currentEntityId={company.id} />

      {/* Quick Actions for Multi-Entity Management */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Button variant="outline" className="h-24 flex-col gap-2">
          <Users className="h-6 w-6" />
          <span>Entity Comparison</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col gap-2">
          <BarChart3 className="h-6 w-6" />
          <span>Network Reports</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col gap-2">
          <Package className="h-6 w-6" />
          <span>Cross-Entity Inventory</span>
        </Button>
        <Button variant="outline" className="h-24 flex-col gap-2">
          <AlertCircle className="h-6 w-6" />
          <span>Compliance Overview</span>
        </Button>
      </div>

      {/* Standard Components with Hub Context */}
      <QuickAccessGrid persona="hub" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SupplyChainTriangleOverview />
        <RecentActivity activities={recentActivity} />
      </div>
    </div>
  );
}

// Spring Dashboard - Learning focused
function SpringDashboard({ user, company, recentActivity, metrics }: MainDashboardProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Check if user needs onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('spring-onboarding-complete');
    if (hasCompletedOnboarding !== 'true') {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <>
      {showOnboarding && <OnboardingWizard />}
      
      <div className="space-y-6">
        {/* Welcome & Progress */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <CardHeader>
            <CardTitle className="text-xl">Your Journey Progress</CardTitle>
            <CardDescription>You&apos;re doing great! Here&apos;s what to focus on today.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Setup Completion</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div className="bg-amber-600 h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                  <span className="text-sm font-medium">65%</span>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-sm font-medium mb-2">Next Steps:</p>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-amber-600" />
                    Upload your first CSV file
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    Configure your first agent
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                    Invite team members
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Tutorial Button */}
        <div className="flex justify-center">
          <Button 
            variant="outline" 
            size="lg"
            onClick={() => setShowOnboarding(true)}
            className="gap-2"
          >
            <Target className="h-5 w-5" />
            Restart Guided Setup
          </Button>
        </div>

        {/* Guided Actions */}
        <QuickAccessGrid persona="spring" />
        
        {/* Learning Resources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SupplyChainTriangleOverview />
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Learning Resources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  📚 Supply Chain Basics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  🎥 Video: First Import Guide
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  💬 Schedule Expert Call
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

// Default Dashboard - Balanced approach
function DefaultDashboard({ user, company, recentActivity, metrics }: MainDashboardProps) {
  return (
    <div className="space-y-6">
      <QuickAccessGrid />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SupplyChainTriangleOverview />
        </div>
        <div>
          <RecentActivity activities={recentActivity} />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Inventory</p>
                <p className="text-2xl font-bold">$1.2M</p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Monthly Sales</p>
                <p className="text-2xl font-bold">$450K</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Suppliers</p>
                <p className="text-2xl font-bold">24</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Alerts</p>
                <p className="text-2xl font-bold">3</p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}