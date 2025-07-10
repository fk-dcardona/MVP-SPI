'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  Target,
  Shield,
  CheckCircle
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
import { NetworkVisualization } from '@/components/hub/NetworkVisualization';
import { ConsolidatedReports } from '@/components/hub/ConsolidatedReports';
import { OnboardingWizard } from '@/components/spring/OnboardingWizardWrapper';
import { ProgressTracking } from '@/components/spring/ProgressTracking';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { SpeedDashboard } from './streamliner/SpeedDashboard';
import { SystemHealthDashboard } from './SystemHealthDashboard';
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
  const router = useRouter();
  const [detectedPersona, setDetectedPersona] = useState<UserPersona | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Enable keyboard shortcuts (desktop only)
  useKeyboardShortcuts();

  useEffect(() => {
    // Check if user has completed onboarding
    const checkOnboarding = async () => {
      // Check localStorage first for quick response
      const hasCompletedOnboarding = localStorage.getItem('onboarding-completed');
      const skipOnboarding = localStorage.getItem('onboarding-skipped');
      
      if (!hasCompletedOnboarding && !skipOnboarding) {
        // Redirect to onboarding if not completed
        router.push('/onboarding');
        return;
      }
      
      // Detect user persona based on behavior patterns
      const persona = await PersonaDetector.detect(user, company);
      setDetectedPersona(persona);
      setIsLoading(false);
    };
    
    checkOnboarding();
  }, [user, company, router]);

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
    case 'processor':
      return <ProcessorDashboard {...{ user, company, recentActivity, metrics }} />;
    default:
      return <DefaultDashboard {...{ user, company, recentActivity, metrics }} />;
  }
}

// Streamliner Dashboard - Speed focused
function StreamlinerDashboard({ user, company, recentActivity, metrics }: MainDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

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

      {/* Tabs for different views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Quick Access</TabsTrigger>
          <TabsTrigger value="speed" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Speed Dashboard
          </TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
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
        </TabsContent>

        <TabsContent value="speed" className="mt-6">
          <SpeedDashboard />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecentActivity activities={recentActivity} />
            <Card>
              <CardHeader>
                <CardTitle>Activity Analytics</CardTitle>
                <CardDescription>Your productivity patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Peak Productivity</p>
                    <p className="text-lg font-semibold">9:00 AM - 11:00 AM</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Average Daily Tasks</p>
                    <p className="text-lg font-semibold">27 tasks</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fastest Process Type</p>
                    <p className="text-lg font-semibold">CSV Uploads (avg 1.2 min)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          <SystemHealthDashboard userPersona="streamliner" />
        </TabsContent>
      </Tabs>
    </div>
  );
}


// Hub Dashboard - Network focused
function HubDashboard({ user, company, recentActivity, metrics }: MainDashboardProps) {
  const [activeView, setActiveView] = useState('network');

  return (
    <div className="space-y-6">
      {/* Multi-Entity Switcher */}
      <EntitySwitcher currentEntityId={company.id} />

      {/* Hub Navigation Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList>
          <TabsTrigger value="network">Network Overview</TabsTrigger>
          <TabsTrigger value="operations">Multi-Entity Ops</TabsTrigger>
          <TabsTrigger value="consolidated">Consolidated View</TabsTrigger>
          <TabsTrigger value="health">System Health</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="mt-6">
          <NetworkVisualization />
        </TabsContent>

        <TabsContent value="operations" className="mt-6 space-y-6">
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
        </TabsContent>

        <TabsContent value="consolidated" className="mt-6">
          <ConsolidatedReports />
        </TabsContent>

        <TabsContent value="health" className="mt-6">
          <SystemHealthDashboard userPersona="hub" />
        </TabsContent>

        <TabsContent value="compliance" className="mt-6">
          <div className="p-8 border-2 border-dashed rounded-lg text-center">
            <h3 className="text-lg font-semibold mb-2">Compliance Dashboard</h3>
            <p className="text-muted-foreground">
              Multi-entity compliance tracking and reporting coming soon
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Spring Dashboard - Learning focused
function SpringDashboard({ user, company, recentActivity, metrics }: MainDashboardProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeView, setActiveView] = useState('progress');
  
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
        {/* Spring Navigation */}
        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="progress">My Progress</TabsTrigger>
            <TabsTrigger value="learn">Learn & Explore</TabsTrigger>
            <TabsTrigger value="practice">Practice Mode</TabsTrigger>
            <TabsTrigger value="health">System</TabsTrigger>
          </TabsList>

          <TabsContent value="progress" className="mt-6">
            <ProgressTracking />
          </TabsContent>

          <TabsContent value="learn" className="mt-6 space-y-6">
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
          </TabsContent>

          <TabsContent value="practice" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Practice Mode</CardTitle>
                <CardDescription>
                  Try out features with sample data - no risk to your real data!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="cursor-pointer hover:border-amber-500 transition-colors">
                    <CardContent className="p-6 text-center">
                      <Package className="h-12 w-12 mx-auto mb-3 text-amber-600" />
                      <h4 className="font-semibold mb-2">Practice CSV Upload</h4>
                      <p className="text-sm text-gray-600">
                        Learn how to format and upload inventory data
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="cursor-pointer hover:border-amber-500 transition-colors">
                    <CardContent className="p-6 text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-3 text-amber-600" />
                      <h4 className="font-semibold mb-2">Explore Analytics</h4>
                      <p className="text-sm text-gray-600">
                        Play with sample data to understand metrics
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-800">
                    💡 <strong>Practice Mode:</strong> All changes here are temporary. 
                    Feel free to experiment - you can&apos;t break anything!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="mt-6">
            <SystemHealthDashboard userPersona="spring" />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

// Processor Dashboard - System stability focused
function ProcessorDashboard({ user, company, recentActivity, metrics }: MainDashboardProps) {
  const [activeView, setActiveView] = useState('health');

  return (
    <div className="space-y-6">
      {/* Processor Header */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="h-6 w-6 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">System Operations Mode</p>
              <p className="text-xs text-gray-700">Monitoring • Reliability • Performance</p>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">99.97%</p>
              <p className="text-xs text-gray-700">Uptime</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-600">Stable</p>
              <p className="text-xs text-gray-700">System Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* Processor Navigation */}
      <Tabs value={activeView} onValueChange={setActiveView}>
        <TabsList>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            System Health
          </TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-6">
          <SystemHealthDashboard userPersona="processor" />
        </TabsContent>

        <TabsContent value="monitoring" className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Real-time Monitoring</CardTitle>
                <CardDescription>Live system metrics and alerts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Database Response Time</span>
                    <Badge variant="default">12ms</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">API Gateway Status</span>
                    <Badge variant="default">Operational</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b">
                    <span className="text-sm">Queue Depth</span>
                    <Badge variant="default">347 messages</Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-sm">Active Connections</span>
                    <Badge variant="secondary">1,247</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Tracking</CardTitle>
                <CardDescription>Last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-lg font-semibold">No Critical Errors</p>
                    <p className="text-sm text-muted-foreground">System operating normally</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold">0</p>
                      <p className="text-xs text-muted-foreground">Critical</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-amber-600">3</p>
                      <p className="text-xs text-muted-foreground">Warnings</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">47</p>
                      <p className="text-xs text-muted-foreground">Info</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 border-2 border-dashed rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">Performance monitoring charts</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>System events and user actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { time: '14:32:17', user: 'system', action: 'Database backup completed', type: 'info' },
                  { time: '14:28:43', user: 'admin', action: 'Configuration updated: rate_limit', type: 'warning' },
                  { time: '14:15:22', user: 'api', action: 'Rate limit threshold reached', type: 'warning' },
                  { time: '13:47:09', user: 'system', action: 'Health check passed', type: 'success' },
                  { time: '13:32:55', user: 'user_42', action: 'Bulk import completed: 15,000 records', type: 'info' },
                ].map((log, index) => (
                  <div key={index} className="flex items-center gap-4 py-2 border-b last:border-0">
                    <span className="text-xs font-mono text-muted-foreground">{log.time}</span>
                    <Badge variant={
                      log.type === 'warning' ? 'secondary' :
                      log.type === 'success' ? 'default' :
                      'outline'
                    }>
                      {log.user}
                    </Badge>
                    <span className="text-sm flex-1">{log.action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="mt-6 space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Configuration changes require elevated permissions and will be logged.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rate Limit (req/min)</label>
                  <input type="number" className="w-full border rounded px-3 py-1" defaultValue="1000" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Session Timeout (min)</label>
                  <input type="number" className="w-full border rounded px-3 py-1" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Max Upload Size (MB)</label>
                  <input type="number" className="w-full border rounded px-3 py-1" defaultValue="100" />
                </div>
                <Button className="w-full" variant="outline">Apply Changes</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Windows</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Automatic Backups</span>
                    <Badge>Daily 2:00 AM</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Updates</span>
                    <Badge>Sunday 3:00 AM</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Next Scheduled</span>
                    <Badge variant="secondary">In 14 hours</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <QuickAccessGrid persona="processor" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SupplyChainTriangleOverview />
            <RecentActivity activities={recentActivity} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
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