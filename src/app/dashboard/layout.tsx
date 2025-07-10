import { DashboardNav } from '@/components/layout/DashboardNav';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { MobileNav } from '@/components/layout/MobileNav';
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Navigation */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <DashboardNav />
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <MobileNav />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col lg:pl-64">
        {/* Top Bar with Breadcrumbs */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <Breadcrumbs />
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}