import { NextRequest, NextResponse } from 'next/server';
import { AgentManager } from '@/lib/agents/manager';
import { createServerClient } from '@/lib/supabase/server';

// This endpoint executes a single agent
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { agentId } = await request.json();

    if (!agentId) {
      return NextResponse.json({ error: 'Agent ID is required' }, { status: 400 });
    }

    // Verify user has access to this agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('company_id')
      .eq('id', agentId)
      .single();

    if (agentError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    if (!profile || profile.company_id !== agent.company_id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Execute agent
    const manager = AgentManager.getInstance();
    const execution = await manager.executeAgent(agentId);

    return NextResponse.json({ execution });
  } catch (error) {
    console.error('Error executing agent:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to execute agent' },
      { status: 500 }
    );
  }
}