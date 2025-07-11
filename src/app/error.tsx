'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div style={{ 
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <div>
          <h2 style={{ 
            marginTop: '1.5rem',
            fontSize: '1.875rem',
            fontWeight: 'bold',
            color: '#111827'
          }}>
            Something went wrong!
          </h2>
          <p style={{ 
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            We encountered an unexpected error. Please try again.
          </p>
        </div>
        
        <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <button
            onClick={reset}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#0070f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Try again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: 'transparent',
              color: '#0070f3',
              border: '1px solid #0070f3',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Go to home
          </button>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details style={{ marginTop: '1rem', textAlign: 'left' }}>
            <summary style={{ 
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              Error details (development only)
            </summary>
            <pre style={{ 
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              color: '#dc2626',
              backgroundColor: '#fef2f2',
              padding: '0.5rem',
              borderRadius: '4px',
              overflow: 'auto'
            }}>
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
} 