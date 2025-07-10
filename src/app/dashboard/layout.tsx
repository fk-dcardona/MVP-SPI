import { DashboardNav } from '@/components/layout/DashboardNav';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { MobileNavigation } from '@/components/navigation/MobileNavigation';
import { DashboardLayoutClient } from '@/components/layout/DashboardLayoutClient';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user profile for mobile navigation
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <DashboardLayoutClient>
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Navigation - New Component */}
        <div className="lg:hidden">
          <MobileNavigation user={profile} notifications={3} />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
          <DashboardNav />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col lg:pl-64">
          {/* Top Bar with Breadcrumbs - Desktop Only */}
          <div className="hidden lg:block sticky top-0 z-10 bg-white border-b border-gray-200">
            <div className="px-4 sm:px-6 lg:px-8 py-4">
              <Breadcrumbs />
            </div>
          </div>

          {/* Page Content with Mobile Padding */}
          <main className="flex-1">
            <div className="lg:p-0 pt-16 pb-20 lg:pt-0 lg:pb-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardLayoutClient>
  );
}