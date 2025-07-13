import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { extendedAnalyticsService } from '@/lib/services/extended-analytics-service';
import { withRateLimit, analyticsRateLimiter, getUserIdentifier } from '@/lib/rate-limiter';
import { APIErrorHandler, validateRequired, validateSKU, validateDays } from '@/lib/api-error-handler';

async function forecastHandler(request: NextRequest): Promise<NextResponse> {
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

  // Get and validate query parameters
  const searchParams = request.nextUrl.searchParams;
  const sku = searchParams.get('sku');
  const daysParam = searchParams.get('days');

  // Validate required parameters
  validateRequired(sku, 'SKU');
  validateSKU(sku!);
  
  const forecastDays = validateDays(daysParam || undefined);

  // Calculate demand forecast
  const forecast = await extendedAnalyticsService.forecastDemand(
    profile.company_id,
    sku!,
    forecastDays
  );

  return NextResponse.json({
    success: true,
    data: forecast,
    metadata: {
      timestamp: new Date().toISOString(),
      forecastPeriod: `${forecastDays} days`,
      company_id: profile.company_id
    }
  });
}

// Apply rate limiting and error handling
export const GET = withRateLimit(analyticsRateLimiter, getUserIdentifier)(
  async (request: NextRequest): Promise<NextResponse> => {
    try {
      return await forecastHandler(request);
    } catch (error) {
      return APIErrorHandler.handle(error, 'forecast endpoint');
    }
  }
);