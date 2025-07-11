'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, getProfile, signOut } from '@/lib/core/auth';

export default function CoreDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { user, error } = await getCurrentUser();
      
      if (error || !user) {
        window.location.href = '/core/auth/login';
        return;
      }

      setUser(user);

      const { data: profileData } = await getProfile(user.id);
      setProfile(profileData);
    } catch (err) {
      console.error('Auth check failed:', err);
      window.location.href = '/core/auth/login';
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/core/auth/login';
    } catch (err: any) {
      setMessage(`Logout error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        fontFamily: 'system-ui, sans-serif'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #eee'
      }}>
        <h1>Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span>Welcome, {user?.email}</span>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {message && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.75rem', 
          backgroundColor: '#fee',
          border: '1px solid #fcc',
          borderRadius: '4px',
          color: '#c33'
        }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
        <div style={{ 
          padding: '1.5rem',
          border: '1px solid #eee',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <h3 style={{ marginTop: 0 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button
              onClick={() => window.location.href = '/core/csv/upload'}
              style={{
                padding: '0.75rem',
                backgroundColor: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              Upload CSV File
            </button>
            <button
              onClick={() => window.location.href = '/core/csv/view'}
              style={{
                padding: '0.75rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              View Uploaded Data
            </button>
          </div>
        </div>

        <div style={{ 
          padding: '1.5rem',
          border: '1px solid #eee',
          borderRadius: '8px',
          backgroundColor: '#f8f9fa'
        }}>
          <h3 style={{ marginTop: 0 }}>User Info</h3>
          <div style={{ fontSize: '0.9rem' }}>
            <p><strong>Email:</strong> {user?.email}</p>
            <p><strong>Company:</strong> {profile?.companies?.name || 'N/A'}</p>
            <p><strong>Role:</strong> {profile?.role || 'user'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}