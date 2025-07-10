import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { MainDashboard } from '@/components/dashboard/MainDashboard';

export const metadata: Metadata = {
  title: 'Dashboard | Finkargo Analytics',
  description: 'Your Supply Chain Intelligence command center',
};

export default async function DashboardPage() {
  const supabase = createServerClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // Fetch user profile and company data
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.companies) {
    redirect('/login');
  }

  // Fetch recent activity
  const { data: recentActivity } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch dashboard metrics
  const { data: metrics } = await supabase
    .from('dashboard_metrics')
    .select('*')
    .eq('company_id', profile.company_id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile.full_name?.split(' ')[0] || 'there'}! 👋
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Here's your Supply Chain Intelligence overview for today
            </p>
          </div>

          <MainDashboard
            user={profile}
            company={profile.companies}
            recentActivity={recentActivity || []}
            metrics={metrics}
          />
        </div>
      </div>
    </div>
  );
}