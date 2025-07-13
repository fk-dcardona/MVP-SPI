import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { extendedAnalyticsService } from '@/lib/services/extended-analytics-service';
import { withRateLimit, analyticsRateLimiter, getUserIdentifier } from '@/lib/rate-limiter';
import { APIErrorHandler, validateIndustry } from '@/lib/api-error-handler';

async function benchmarksHandler(request: NextRequest): Promise<NextResponse> {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'AUTH_REQUIRED', timestamp: new Date().toISOString() },
      { status: 401 }
    );
  }

  // Get user's company
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.company_id) {
    return NextResponse.json(
      { error: 'Company profile not found', code: 'COMPANY_NOT_FOUND', timestamp: new Date().toISOString() },
      { status: 404 }
    );
  }

  // Get and validate industry parameter
  const searchParams = request.nextUrl.searchParams;
  const industryParam = searchParams.get('industry');
  const industry = validateIndustry(industryParam || undefined);

  // Compare to industry benchmarks
  const benchmarks = await extendedAnalyticsService.compareToIndustryBenchmarks(
    profile.company_id,
    industry
  );

  return NextResponse.json({
    success: true,
    data: {
      industry,
      benchmarks,
      companyMetrics: benchmarks.length
    },
    metadata: {
      timestamp: new Date().toISOString(),
      company_id: profile.company_id,
      benchmarkType: industry
    }
  });
}

// Apply rate limiting and error handling
export const GET = withRateLimit(analyticsRateLimiter, getUserIdentifier)(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await benchmarksHandler(request);
    } catch (error) {
      return APIErrorHandler.handle(error, 'benchmarks endpoint');
    }
  }
);