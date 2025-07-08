import { NextRequest, NextResponse } from 'next/server';
import { AgentManager } from '@/lib/agents/manager';

// Vercel Cron Job configuration
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

// This endpoint is designed to be called by Vercel Cron
// Add to vercel.json:
// {
//   "crons": [{
//     "path": "/api/cron/agents",
//     "schedule": "*/5 * * * *"
//   }]
// }

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    
    if (process.env.CRON_SECRET) {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('Starting scheduled agent execution...');
    
    const manager = AgentManager.getInstance();
    await manager.runScheduledAgents();

    console.log('Scheduled agent execution completed');

    return NextResponse.json({ 
      success: true,
      message: 'Scheduled agents executed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json(
      { 
        error: 'Failed to run scheduled agents',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}