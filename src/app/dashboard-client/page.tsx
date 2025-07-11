'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ClientDashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/login');
          return;
        }
        
        setUser(session.user);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Finkargo Analytics!</h2>
          
          <div className="space-y-2">
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.user_metadata?.role || 'User'}</p>
            <p><strong>Name:</strong> {user.user_metadata?.full_name || 'N/A'}</p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900">Inventory</h3>
              <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
              <p className="text-sm text-blue-700">Total Items</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="font-semibold text-green-900">Sales</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">0</p>
              <p className="text-sm text-green-700">This Month</p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="font-semibold text-purple-900">Alerts</h3>
              <p className="text-3xl font-bold text-purple-600 mt-2">0</p>
              <p className="text-sm text-purple-700">Active</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/dashboard/upload" className="bg-gray-100 p-4 rounded text-center hover:bg-gray-200">
                Upload CSV
              </a>
              <a href="/dashboard/inventory" className="bg-gray-100 p-4 rounded text-center hover:bg-gray-200">
                View Inventory
              </a>
              <a href="/dashboard/sales" className="bg-gray-100 p-4 rounded text-center hover:bg-gray-200">
                View Sales
              </a>
              <a href="/dashboard/agents" className="bg-gray-100 p-4 rounded text-center hover:bg-gray-200">
                Manage Agents
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}