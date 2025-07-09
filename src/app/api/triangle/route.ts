import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { triangleService } from '@/lib/services/supply-chain-triangle';

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });

  // Check authentication
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get user's company
  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', session.user.id)
    .single();

  if (!profile?.company_id) {
    return NextResponse.json({ error: 'No company associated with user' }, { status: 400 });
  }

  try {
    // Calculate triangle scores
    const analysis = await triangleService.calculateTriangleScores(profile.company_id);
    
    return NextResponse.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error calculating triangle scores:', error);
    return NextResponse.json(
      { error: 'Failed to calculate triangle scores' },
      { status: 500 }
    );
  }
}