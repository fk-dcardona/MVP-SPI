'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

interface ErrorFallbackProps {
  error?: Error;
  resetError: () => void;
}

const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => (
  <Card className="w-full max-w-md mx-auto border-destructive/50">
    <CardHeader className="text-center">
      <div className="mx-auto mb-4 rounded-full bg-destructive/10 p-3 w-fit">
        <AlertTriangle className="h-6 w-6 text-destructive" />
      </div>
      <CardTitle className="text-destructive">Something went wrong</CardTitle>
      <CardDescription>
        {error?.message || 'An unexpected error occurred'}
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <Button onClick={resetError} className="w-full" variant="outline">
        <RefreshCw className="h-4 w-4 mr-2" />
        Try again
      </Button>
      {process.env.NODE_ENV === 'development' && error && (
        <details className="text-xs text-muted-foreground">
          <summary>Error details</summary>
          <pre className="mt-2 whitespace-pre-wrap">{error.stack}</pre>
        </details>
      )}
    </CardContent>
  </Card>
);

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;