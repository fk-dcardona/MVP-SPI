'use client';

import { MobileDashboardEnhanced } from '@/components/dashboard/MobileDashboardEnhanced';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Smartphone } from 'lucide-react';

export default function TestMobileSwipePage() {
  const [showMobile, setShowMobile] = useState(false);
  
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
    { id: '3', title: 'Report Generated', time: '5 hours ago' },
  ];

  const mockMetrics = {
    inventory_value: 1200000,
    monthly_sales: 450000,
    active_suppliers: 24,
    open_alerts: 3,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Mobile Swipe Navigation Test</CardTitle>
            <CardDescription>
              Test touch gestures and mobile-optimized interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Test Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click the button to view mobile interface</li>
                <li>Use arrow keys or swipe (on touch devices) to navigate</li>
                <li>Test the progress indicator at top</li>
                <li>Try the view dots at bottom</li>
                <li>Test pinch-to-zoom for fullscreen</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <h4 className="font-medium mb-2">Expected Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Swipe left/right navigation</li>
                  <li>Progress bar showing current view</li>
                  <li>Touch-friendly interface</li>
                  <li>View transition animations</li>
                  <li>Keyboard navigation support</li>
                  <li>Fullscreen toggle</li>
                  <li>One-time swipe hint</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Views Available:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Quick Access</li>
                  <li>Supply Chain Triangle</li>
                  <li>Recent Activity</li>
                  <li>Key Metrics</li>
                </ol>
              </div>
            </div>

            <Button 
              onClick={() => setShowMobile(true)}
              size="lg"
              className="w-full gap-2"
            >
              <Smartphone className="h-5 w-5" />
              Open Mobile View
            </Button>

            {showMobile && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
                  {/* Phone Frame */}
                  <div className="absolute inset-0 border-8 border-gray-800 rounded-2xl pointer-events-none z-10" />
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 w-20 h-1 bg-gray-800 rounded-full pointer-events-none z-20" />
                  
                  {/* Mobile Content */}
                  <div className="w-[375px] h-[812px] overflow-hidden">
                    <MobileDashboardEnhanced
                      user={mockUser}
                      company={mockCompany}
                      recentActivity={mockActivity}
                      metrics={mockMetrics}
                    />
                  </div>
                  
                  {/* Close Button */}
                  <Button
                    variant="secondary"
                    size="sm"
                    className="absolute top-12 right-12 z-50"
                    onClick={() => setShowMobile(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Touch Gesture Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Swipe Left</span>
                <span className="text-muted-foreground">Next view</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Swipe Right</span>
                <span className="text-muted-foreground">Previous view</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Pinch Out</span>
                <span className="text-muted-foreground">Enter fullscreen</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Pinch In</span>
                <span className="text-muted-foreground">Exit fullscreen</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Arrow Keys</span>
                <span className="text-muted-foreground">Navigate (desktop)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}