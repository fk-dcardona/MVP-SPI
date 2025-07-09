'use client';

import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Biomimetic Pattern: Error Boundary as mycelium's damage compartmentalization
// When part of the network is damaged, it isolates the issue and reroutes
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    // Optionally reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Mycelium-inspired recovery UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <CardTitle>Network Recovery Mode</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                The system encountered an issue and has isolated the problem to prevent further damage.
              </p>
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-sm font-mono text-gray-700">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="default">
                  Reconnect to Network
                </Button>
                <Button 
                  onClick={() => window.location.href = '/login'} 
                  variant="outline"
                >
                  Return to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}