'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CommandPalette } from '@/components/CommandPalette';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestCommandPalettePage() {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [actionLog, setActionLog] = useState<string[]>([]);

  // Override console.log to capture navigation attempts
  if (typeof window !== 'undefined') {
    const originalLog = console.log;
    console.log = (...args) => {
      if (args[0]?.includes('Navigate to') || args[0]?.includes('Performing')) {
        setActionLog(prev => [...prev, args[0]]);
      }
      originalLog(...args);
    };
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Command Palette Test</CardTitle>
            <CardDescription>
              Test the command palette functionality and keyboard shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold">Test Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Click the button below or press ⌘K (Mac) / Ctrl+K (Windows)</li>
                <li>Type to search for commands</li>
                <li>Use arrow keys to navigate</li>
                <li>Press Enter to execute a command</li>
                <li>Press Escape to close</li>
              </ol>
            </div>

            <Button 
              onClick={() => setShowCommandPalette(true)}
              size="lg"
              className="w-full"
            >
              Open Command Palette (⌘K)
            </Button>

            <div className="pt-4">
              <h3 className="font-semibold mb-2">Expected Features:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>40+ commands available</li>
                <li>Fuzzy search by command name or keywords</li>
                <li>Keyboard shortcuts displayed</li>
                <li>Recent commands tracking</li>
                <li>Speed mode toggle</li>
                <li>Grouped by category</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {actionLog.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Action Log</CardTitle>
              <CardDescription>
                Commands that were triggered (for testing purposes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {actionLog.map((log, index) => (
                  <div key={index} className="text-sm font-mono text-muted-foreground">
                    {log}
                  </div>
                ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setActionLog([])}
              >
                Clear Log
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {showCommandPalette && (
        <CommandPalette onClose={() => setShowCommandPalette(false)} />
      )}
    </div>
  );
}