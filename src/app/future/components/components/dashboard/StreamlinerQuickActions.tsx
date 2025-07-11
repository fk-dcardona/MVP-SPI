'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  Zap, 
  RefreshCw, 
  Download, 
  Play,
  BarChart
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function StreamlinerQuickActions() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const quickActions = [
    {
      label: 'Quick Upload',
      icon: <Upload className="h-4 w-4" />,
      action: () => router.push('/dashboard/upload'),
      variant: 'default' as const,
      shortcut: '⌘U'
    },
    {
      label: 'Run All Agents',
      icon: <Play className="h-4 w-4" />,
      action: async () => {
        setIsProcessing(true);
        // Simulate agent execution
        setTimeout(() => setIsProcessing(false), 2000);
      },
      variant: 'outline' as const,
      shortcut: '⌘R'
    },
    {
      label: 'Refresh Data',
      icon: <RefreshCw className="h-4 w-4" />,
      action: () => window.location.reload(),
      variant: 'outline' as const,
      shortcut: '⌘⇧R'
    },
    {
      label: 'Export Report',
      icon: <Download className="h-4 w-4" />,
      action: () => console.log('Export triggered'),
      variant: 'outline' as const,
      shortcut: '⌘E'
    },
    {
      label: 'Speed Metrics',
      icon: <BarChart className="h-4 w-4" />,
      action: () => router.push('/dashboard/speed'),
      variant: 'outline' as const,
      shortcut: '⌘S'
    }
  ];

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-900">Quick Actions</span>
          </div>
          
          <div className="flex items-center space-x-2">
            {quickActions.map((action, index) => (
              <div key={index} className="relative group">
                <Button
                  size="sm"
                  variant={action.variant}
                  onClick={action.action}
                  disabled={isProcessing}
                  className={action.variant === 'default' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  {action.icon}
                  <span className="ml-2 hidden sm:inline">{action.label}</span>
                </Button>
                
                {/* Tooltip showing keyboard shortcut */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {action.shortcut}
                </div>
              </div>
            ))}
          </div>
        </div>

        {isProcessing && (
          <div className="mt-3 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Processing... This usually takes 2-3 seconds</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}