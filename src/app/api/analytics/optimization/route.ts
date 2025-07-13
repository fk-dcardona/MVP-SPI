import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { extendedAnalyticsService } from '@/lib/services/extended-analytics-service';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get optimization type from query params
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || 'all';

    let data: any = {};

    if (type === 'cost' || type === 'all') {
      data.costOptimizations = await extendedAnalyticsService.identifyCostOptimizations(
        profile.company_id
      );
    }

    if (type === 'inventory' || type === 'all') {
      data.inventoryOptimization = await extendedAnalyticsService.optimizeMultiEchelonInventory(
        profile.company_id
      );
    }

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error identifying optimizations:', error);
    return NextResponse.json(
      { error: 'Failed to identify optimization opportunities' },
      { status: 500 }
    );
  }
}