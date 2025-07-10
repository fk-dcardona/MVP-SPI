import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    
    // Server-specific options
    autoSessionTracking: true,
    
    // Integrations
    integrations: [
      // Automatically instrument Node.js libraries and frameworks
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],
    
    // Filtering
    ignoreErrors: [
      // Known errors
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'ECONNRESET',
    ],
    
    // Transaction filtering
    beforeSendTransaction(transaction) {
      // Don't track health checks
      if (transaction.transaction === 'GET /api/health') {
        return null;
      }
      
      return transaction;
    },
    
    // Error filtering
    beforeSend(event, hint) {
      // Filter out non-error level events in production
      if (
        process.env.NODE_ENV === 'production' &&
        event.level !== 'error' &&
        event.level !== 'fatal'
      ) {
        return null;
      }
      
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }
      
      return event;
    },
  });
}