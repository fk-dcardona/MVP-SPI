'use client';

import { useState } from 'react';
import { signIn } from '@/lib/core/auth';

export default function CoreLoginPage() {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('demo123');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await signIn(email, password);

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('Success! Redirecting...');
        setTimeout(() => {
          window.location.href = '/core/dashboard';
        }, 500);
      }
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '2rem', 
      maxWidth: '400px', 
      margin: '0 auto',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>
        Supply Chain Intelligence
      </h1>
      
      <form onSubmit={handleLogin} style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem' 
      }}>
        <div>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Email:
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem' }}>
            Password:
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '0.75rem',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '1rem'
            }}
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '0.75rem', 
            backgroundColor: loading ? '#ccc' : '#0070f3', 
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      {message && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '0.75rem', 
          backgroundColor: message.includes('Error') ? '#fee' : '#efe',
          border: `1px solid ${message.includes('Error') ? '#fcc' : '#cfc'}`,
          borderRadius: '4px',
          color: message.includes('Error') ? '#c33' : '#363'
        }}>
          {message}
        </div>
      )}
    </div>
  );
}