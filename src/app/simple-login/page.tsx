'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function SimpleLogin() {
  const [status, setStatus] = useState('');
  
  const handleLogin = async () => {
    setStatus('Logging in...');
    
    try {
      const supabase = createClient();
      
      // Clear any existing session first
      await supabase.auth.signOut();
      
      // Sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'admin@demo.com',
        password: 'demo123',
      });

      if (error) {
        setStatus(`Error: ${error.message}`);
        return;
      }

      setStatus('Login successful! Session created.');
      
      // Log everything
      console.log('Login response:', data);
      
      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Session after login:', session);
      
      // Show session info
      if (session) {
        setStatus(`Logged in as: ${session.user.email}\n\nNow try visiting /dashboard manually`);
      }
      
    } catch (err: any) {
      setStatus(`Unexpected error: ${err.message}`);
      console.error(err);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setStatus('Logged out');
  };

  const checkSession = async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      setStatus(`Active session for: ${session.user.email}`);
    } else {
      setStatus('No active session');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Simple Login Test</h1>
      
      <div className="space-y-4">
        <button
          onClick={handleLogin}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Login as admin@demo.com
        </button>
        
        <button
          onClick={checkSession}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-4"
        >
          Check Session
        </button>
        
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-4"
        >
          Logout
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <pre className="whitespace-pre-wrap">{status}</pre>
      </div>
      
      <div className="mt-6 space-y-2">
        <p>After logging in, try these links:</p>
        <a href="/dashboard-client" className="text-blue-600 hover:underline block">→ Go to Client Dashboard (No Server Components)</a>
        <a href="/dashboard" className="text-blue-600 hover:underline block">→ Go to Original Dashboard</a>
        <a href="/login" className="text-blue-600 hover:underline block">→ Go to Login Page</a>
      </div>
    </div>
  );
}