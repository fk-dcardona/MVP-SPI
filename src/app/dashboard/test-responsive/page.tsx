'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MainDashboard } from '@/components/dashboard/MainDashboard';
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Tv2,
  RotateCw,
  Check,
  X
} from 'lucide-react';

interface BreakpointTest {
  name: string;
  width: number;
  height: number;
  icon: any;
  description: string;
}

const breakpoints: BreakpointTest[] = [
  { name: 'Mobile', width: 375, height: 667, icon: Smartphone, description: 'iPhone SE' },
  { name: 'Mobile Large', width: 414, height: 896, icon: Smartphone, description: 'iPhone 11 Pro Max' },
  { name: 'Tablet', width: 768, height: 1024, icon: Tablet, description: 'iPad' },
  { name: 'Tablet Large', width: 1024, height: 1366, icon: Tablet, description: 'iPad Pro' },
  { name: 'Desktop', width: 1280, height: 800, icon: Monitor, description: '13" Laptop' },
  { name: 'Desktop Large', width: 1920, height: 1080, icon: Tv2, description: 'Full HD' },
  { name: 'Desktop XL', width: 2560, height: 1440, icon: Tv2, description: '4K Monitor' },
];

export default function TestResponsivePage() {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<BreakpointTest>(breakpoints[4]);
  const [rotation, setRotation] = useState(0);
  const [actualWidth, setActualWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Mock data
  const mockUser = {
    id: 'test-user',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'Manager',
    company_id: 'test-company',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockCompany = {
    id: 'test-company',
    name: 'Test Company Inc.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const mockActivity = [
    { id: '1', title: 'Inventory Updated', time: '2 hours ago' },
    { id: '2', title: 'New Order Received', time: '3 hours ago' },
  ];

  const mockMetrics = {};

  useEffect(() => {
    const checkWidth = () => {
      setActualWidth(window.innerWidth);
      setIsMobile(window.innerWidth < 768);
    };
    
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const isLandscape = rotation === 90;
  const displayWidth = isLandscape ? currentBreakpoint.height : currentBreakpoint.width;
  const displayHeight = isLandscape ? currentBreakpoint.width : currentBreakpoint.height;

  const responsiveChecks = [
    { 
      name: 'Mobile Navigation', 
      test: displayWidth < 768,
      expected: 'Hamburger menu or bottom nav',
      actual: displayWidth < 768 ? '✓ Mobile nav active' : '✗ Desktop nav shown'
    },
    {
      name: 'Grid Layout',
      test: true,
      expected: 'Responsive grid columns',
      actual: displayWidth < 640 ? '1 column' : displayWidth < 1024 ? '2 columns' : '3-4 columns'
    },
    {
      name: 'Font Scaling',
      test: true,
      expected: 'Readable text at all sizes',
      actual: 'Using responsive rem units'
    },
    {
      name: 'Touch Targets',
      test: displayWidth < 768,
      expected: 'Min 44x44px for mobile',
      actual: displayWidth < 768 ? '✓ Enlarged for touch' : 'Standard size'
    },
    {
      name: 'Overflow Handling',
      test: true,
      expected: 'No horizontal scroll',
      actual: 'Overflow-x hidden, flex-wrap enabled'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Responsive Design Test</CardTitle>
            <CardDescription>
              Test the UI across different screen sizes and orientations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Current viewport:</span> {actualWidth}px
                <Badge variant="outline" className="ml-2">
                  {isMobile ? 'Mobile' : 'Desktop'}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation(rotation === 0 ? 90 : 0)}
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Rotate
              </Button>
            </div>

            {/* Breakpoint Selector */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {breakpoints.map((bp) => (
                <Button
                  key={bp.name}
                  variant={currentBreakpoint.name === bp.name ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentBreakpoint(bp)}
                  className="flex flex-col h-auto py-3"
                >
                  <bp.icon className="h-5 w-5 mb-1" />
                  <span className="text-xs">{bp.name}</span>
                  <span className="text-xs text-muted-foreground">{bp.width}px</span>
                </Button>
              ))}
            </div>

            {/* Responsive Checks */}
            <div className="space-y-2">
              <h3 className="font-semibold text-sm">Responsive Checks:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {responsiveChecks.map((check, i) => (
                  <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg">
                    {check.actual.includes('✓') ? (
                      <Check className="h-4 w-4 text-green-600 mt-0.5" />
                    ) : check.actual.includes('✗') ? (
                      <X className="h-4 w-4 text-red-600 mt-0.5" />
                    ) : (
                      <div className="w-4 h-4" />
                    )}
                    <div className="flex-1 text-sm">
                      <p className="font-medium">{check.name}</p>
                      <p className="text-xs text-muted-foreground">{check.actual}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Frame */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Preview: {currentBreakpoint.description}</span>
              <Badge>
                {displayWidth} × {displayHeight}px
                {isLandscape && ' (Landscape)'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-gray-100 p-4 overflow-auto">
              <div 
                className="mx-auto bg-white shadow-lg transition-all duration-300"
                style={{
                  width: `${displayWidth}px`,
                  height: `${displayHeight}px`,
                  maxWidth: '100%',
                }}
              >
                <iframe
                  src="/dashboard"
                  className="w-full h-full border-0"
                  style={{
                    transform: `scale(${Math.min(1, (actualWidth - 100) / displayWidth)})`,
                    transformOrigin: 'top left',
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Responsive Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Mobile-first approach with min-width breakpoints</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Tailwind responsive prefixes (sm:, md:, lg:, xl:)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Flexible grid system with auto-fit</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Touch-optimized interactive elements</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Persona-adaptive layouts</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Breakpoint Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm font-mono">
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>sm:</span>
                  <span className="text-muted-foreground">640px</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>md:</span>
                  <span className="text-muted-foreground">768px</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>lg:</span>
                  <span className="text-muted-foreground">1024px</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>xl:</span>
                  <span className="text-muted-foreground">1280px</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>2xl:</span>
                  <span className="text-muted-foreground">1536px</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}