'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface StorageItem {
  key: string;
  value: any;
  description: string;
  component: string;
}

export default function TestLocalStoragePage() {
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const expectedKeys = [
    {
      key: 'user-persona',
      description: 'Detected user persona (streamliner, navigator, hub, spring)',
      component: 'MainDashboard',
    },
    {
      key: 'streamliner-shortcuts',
      description: 'Enabled keyboard shortcuts for Streamliner users',
      component: 'useKeyboardShortcuts',
    },
    {
      key: 'command-palette-recent',
      description: 'Recently used commands in Command Palette',
      component: 'CommandPalette',
    },
    {
      key: 'navigator-dashboard-widgets',
      description: 'Widget configuration for Navigator dashboard',
      component: 'NavigatorCustomization',
    },
    {
      key: 'navigator-saved-views',
      description: 'Saved custom views for Navigator users',
      component: 'NavigatorCustomization',
    },
    {
      key: 'mobile-swipe-hint-seen',
      description: 'Whether mobile swipe hint has been shown',
      component: 'MobileDashboardEnhanced',
    },
    {
      key: 'spring-onboarding-complete',
      description: 'Spring user onboarding completion status',
      component: 'OnboardingWizard',
    },
    {
      key: 'spring-onboarding-answers',
      description: 'Answers from Spring onboarding process',
      component: 'OnboardingWizard',
    },
    {
      key: 'spring-onboarding-steps',
      description: 'Completed onboarding steps for Spring users',
      component: 'OnboardingWizard',
    },
  ];

  const scanLocalStorage = () => {
    const items: StorageItem[] = [];
    
    expectedKeys.forEach(({ key, description, component }) => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          items.push({
            key,
            value: JSON.parse(value),
            description,
            component,
          });
        } catch {
          items.push({
            key,
            value,
            description,
            component,
          });
        }
      }
    });

    // Also check for any unexpected keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !expectedKeys.find(k => k.key === key)) {
        const value = localStorage.getItem(key);
        try {
          items.push({
            key,
            value: value ? JSON.parse(value) : null,
            description: 'Unknown/Unexpected key',
            component: 'Unknown',
          });
        } catch {
          items.push({
            key,
            value,
            description: 'Unknown/Unexpected key',
            component: 'Unknown',
          });
        }
      }
    }

    setStorageItems(items);
    setLastRefresh(new Date());
  };

  useEffect(() => {
    scanLocalStorage();
  }, []);

  const clearItem = (key: string) => {
    localStorage.removeItem(key);
    scanLocalStorage();
  };

  const clearAll = () => {
    if (confirm('Clear all localStorage data? This cannot be undone.')) {
      localStorage.clear();
      scanLocalStorage();
    }
  };

  const setTestData = () => {
    // Set some test data
    localStorage.setItem('user-persona', JSON.stringify('navigator'));
    localStorage.setItem('streamliner-shortcuts', 'true');
    localStorage.setItem('command-palette-recent', JSON.stringify(['upload', 'inventory', 'refresh']));
    localStorage.setItem('navigator-dashboard-widgets', JSON.stringify([
      { id: '1', title: 'Supply Chain Triangle', enabled: true, order: 0 },
      { id: '2', title: 'Alert Panel', enabled: true, order: 1 },
      { id: '3', title: 'Performance Metrics', enabled: false, order: 2 },
    ]));
    localStorage.setItem('mobile-swipe-hint-seen', 'true');
    localStorage.setItem('spring-onboarding-complete', 'false');
    
    scanLocalStorage();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>LocalStorage Persistence Test</CardTitle>
            <CardDescription>
              Verify all features correctly persist data in localStorage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Last refreshed: {lastRefresh.toLocaleTimeString()}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={setTestData}>
                  Set Test Data
                </Button>
                <Button variant="outline" size="sm" onClick={scanLocalStorage}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="destructive" size="sm" onClick={clearAll}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold">Expected Keys:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {expectedKeys.map(({ key, description }) => {
                  const found = storageItems.find(item => item.key === key);
                  return (
                    <div 
                      key={key} 
                      className="flex items-center gap-2 p-2 rounded-lg bg-gray-50"
                    >
                      {found ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={`text-sm ${found ? 'font-medium' : 'text-gray-500'}`}>
                        {key}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {storageItems.map(({ key, value, description, component }) => (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-mono">{key}</CardTitle>
                    <CardDescription className="mt-1">{description}</CardDescription>
                  </div>
                  <Badge variant="secondary">{component}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-auto max-h-32">
                  {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                </pre>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => clearItem(key)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Remove
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {storageItems.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No data found in localStorage. Try interacting with the features or click "Set Test Data".
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}