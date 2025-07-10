import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    
    // Release tracking
    release: process.env.NEXT_PUBLIC_APP_VERSION,
    
    // Integrations
    integrations: [
      new Sentry.BrowserTracing({
        tracingOrigins: [
          'localhost',
          process.env.NEXT_PUBLIC_APP_URL || '',
          /^\//,
        ],
        routingInstrumentation: Sentry.nextRouterInstrumentation,
      }),
      new Sentry.Replay({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    
    // Filtering
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Facebook related errors
      'fb_xd_fragment',
      // Safari private mode
      'QuotaExceededError',
      // Network errors
      'NetworkError',
      'Failed to fetch',
    ],
    
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      // Other browsers
      /^moz-extension:\/\//i,
      /^ms-browser-extension:\/\//i,
    ],
    
    // User context
    beforeSend(event, hint) {
      // Remove sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      
      // Add user context if available
      if (typeof window !== 'undefined') {
        const user = window.localStorage.getItem('user');
        if (user) {
          try {
            const userData = JSON.parse(user);
            event.user = {
              id: userData.id,
              email: userData.email,
            };
          } catch (e) {
            // Invalid user data
          }
        }
      }
      
      return event;
    },
  });
}