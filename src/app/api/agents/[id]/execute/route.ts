import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { AgentManager } from '@/lib/agents/manager';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('user_id', user.id)
      .single();

    if (!profile?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if agent exists and belongs to user's company
    const { data: agent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('id', params.id)
      .eq('company_id', profile.company_id)
      .single();

    if (fetchError || !agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    // Check if agent is active
    if (agent.status !== 'active') {
      return NextResponse.json({ 
        error: 'Agent is not active. Please activate the agent before executing.' 
      }, { status: 400 });
    }

    // Get agent manager instance and execute agent
    const agentManager = AgentManager.getInstance();
    
    // Execute agent asynchronously
    agentManager.executeAgent(params.id).catch(error => {
      console.error(`Error executing agent ${params.id}:`, error);
    });

    return NextResponse.json({ 
      message: 'Agent execution started',
      agentId: params.id
    });
  } catch (error) {
    console.error('Error in POST /api/agents/[id]/execute:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 