import { NextRequest, NextResponse } from 'next/server';
import { AgentManager } from '@/lib/agents/manager';
import { createServerClient } from '@/lib/supabase/server';

// This endpoint runs all scheduled agents
// Should be called by a cron job or external scheduler
export async function POST(request: NextRequest) {
  try {
    // Verify the request is from an authorized source
    // In production, you'd want to check for a secret key or similar
    const authHeader = request.headers.get('Authorization');
    const expectedToken = process.env.AGENT_SCHEDULER_SECRET;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const manager = AgentManager.getInstance();
    await manager.runScheduledAgents();

    return NextResponse.json({ success: true, message: 'Scheduled agents executed' });
  } catch (error) {
    console.error('Error running scheduled agents:', error);
    return NextResponse.json(
      { error: 'Failed to run scheduled agents' },
      { status: 500 }
    );
  }
}

// GET endpoint to check scheduler health
export async function GET() {
  return NextResponse.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
}