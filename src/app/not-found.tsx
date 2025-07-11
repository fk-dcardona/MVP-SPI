'use client';

export default function NotFound() {
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
            Page Not Found
          </h2>
          <p style={{ 
            marginTop: '0.5rem',
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            The page you're looking for doesn't exist.
          </p>
        </div>
        
        <div style={{ marginTop: '2rem' }}>
          <button
            onClick={() => window.location.href = '/'}
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
            Go to home
          </button>
        </div>
      </div>
    </div>
  );
} 