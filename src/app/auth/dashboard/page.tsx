'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SimpleDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
      } else {
        window.location.href = '/auth/simple-login';
      }
    } catch (error) {
      console.error('Auth error:', error);
      window.location.href = '/auth/simple-login';
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/auth/simple-login';
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Dashboard</h1>
        <button 
          onClick={handleLogout}
          style={{ 
            padding: '0.5rem 1rem', 
            backgroundColor: '#dc2626', 
            color: 'white',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          Logout
        </button>
      </div>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#f3f4f6',
        border: '1px solid #e5e7eb'
      }}>
        <h2>User Information</h2>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>ID:</strong> {user.id}</p>
        <p><strong>Role:</strong> {user.user_metadata?.role || 'User'}</p>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Quick Links</h2>
        <ul>
          <li><a href="/dashboard/upload">Upload CSV (Original)</a></li>
          <li><a href="/dashboard/inventory">Inventory (Original)</a></li>
          <li><a href="/auth/simple-login">Back to Login</a></li>
        </ul>
      </div>

      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        backgroundColor: '#fef3c7',
        border: '1px solid #fbbf24'
      }}>
        <strong>✅ Authentication is working!</strong>
        <p>This is a minimal dashboard without complex UI components.</p>
        <p>Now we can build up from this solid foundation.</p>
      </div>
    </div>
  );
}