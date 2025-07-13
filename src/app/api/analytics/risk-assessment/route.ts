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

    // Assess risks
    const risks = await extendedAnalyticsService.assessRisks(profile.company_id);

    // Generate alerts based on risk assessment
    const alerts = await extendedAnalyticsService.generateAlerts(profile.company_id);

    return NextResponse.json({
      success: true,
      data: {
        risks,
        alerts
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error assessing risks:', error);
    return NextResponse.json(
      { error: 'Failed to assess risks' },
      { status: 500 }
    );
  }
}