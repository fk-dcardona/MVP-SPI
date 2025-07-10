'use client';

import { NavigatorCustomization } from '@/components/dashboard/navigator/NavigatorCustomization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

export default function TestNavigatorCustomizationPage() {
  const [savedViews, setSavedViews] = useState<string[]>([]);
  const [currentWidgetOrder, setCurrentWidgetOrder] = useState<string[]>([]);

  useEffect(() => {
    // Check localStorage for saved data
    const views = localStorage.getItem('navigator-saved-views');
    if (views) {
      try {
        const parsed = JSON.parse(views);
        setSavedViews(Object.keys(parsed));
      } catch (e) {
        console.error('Error parsing saved views:', e);
      }
    }

    const widgets = localStorage.getItem('navigator-dashboard-widgets');
    if (widgets) {
      try {
        const parsed = JSON.parse(widgets);
        setCurrentWidgetOrder(parsed.map((w: any) => w.title));
      } catch (e) {
        console.error('Error parsing widgets:', e);
      }
    }
  }, []);

  const clearLocalStorage = () => {
    localStorage.removeItem('navigator-saved-views');
    localStorage.removeItem('navigator-dashboard-widgets');
    setSavedViews([]);
    setCurrentWidgetOrder([]);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Navigator Widget Customization Test</CardTitle>
            <CardDescription>
              Test drag-and-drop functionality and saved views
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Test Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Drag widgets to reorder them</li>
                <li>Toggle widget visibility</li>
                <li>Adjust widget sizes (if available)</li>
                <li>Save custom views with names</li>
                <li>Load saved views</li>
                <li>Check localStorage persistence</li>
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div>
                <h4 className="font-medium mb-2">Expected Features:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Drag & drop widget reordering</li>
                  <li>Visual feedback during drag</li>
                  <li>Widget enable/disable toggles</li>
                  <li>Save multiple custom layouts</li>
                  <li>Quick layout templates</li>
                  <li>Persistent storage in localStorage</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Current State:</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Saved Views:</span>{' '}
                    {savedViews.length > 0 ? savedViews.join(', ') : 'None'}
                  </div>
                  <div>
                    <span className="font-medium">Widget Order:</span>{' '}
                    {currentWidgetOrder.length > 0 ? (
                      <ol className="list-decimal list-inside mt-1">
                        {currentWidgetOrder.map((widget, i) => (
                          <li key={i}>{widget}</li>
                        ))}
                      </ol>
                    ) : (
                      'Default'
                    )}
                  </div>
                </div>
                
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="mt-4"
                  onClick={clearLocalStorage}
                >
                  Clear All Saved Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Navigator Customization Component</CardTitle>
          </CardHeader>
          <CardContent>
            <NavigatorCustomization />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}