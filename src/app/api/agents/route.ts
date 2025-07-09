import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { AgentFactory } from '@/lib/agents/factory';
import { AgentManager } from '@/lib/agents/manager';
import type { Agent } from '@/lib/agents/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
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

    // Get agents for the company
    const { data: agents, error } = await supabase
      .from('agents')
      .select(`
        *,
        agent_metrics (
          total_executions,
          successful_executions,
          failed_executions,
          average_execution_time_ms,
          uptime_percentage
        )
      `)
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching agents:', error);
      return NextResponse.json({ error: 'Failed to fetch agents' }, { status: 500 });
    }

    return NextResponse.json({ agents: agents || [] });
  } catch (error) {
    console.error('Error in GET /api/agents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    
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

    const body = await request.json();
    const { name, type, config } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    // Create agent using factory
    let agent: Agent = {
      id: crypto.randomUUID(),
      company_id: profile.company_id,
      type,
      name,
      config,
      status: 'inactive',
      created_at: new Date(),
      updated_at: new Date(),
    };
    try {
      // Validate agent configuration
      const isValid = AgentFactory.getInstance().validateConfig(type, config);
      if (!isValid) {
        return NextResponse.json({ 
          error: 'Invalid agent configuration',
        }, { status: 400 });
      }
      // Create agent instance (not used further here, but for completeness)
      AgentFactory.getInstance().createAgent(agent);
    } catch (error) {
      console.error('Error creating agent:', error);
      return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
    }

    // Insert agent into database
    const { data: insertedAgent, error: insertError } = await supabase
      .from('agents')
      .insert({
        id: agent.id,
        name: agent.name,
        type: agent.type,
        status: agent.status,
        config: agent.config,
        company_id: profile.company_id,
        next_run: agent.next_run?.toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting agent:', insertError);
      return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
    }

    return NextResponse.json({ 
      agent: insertedAgent,
      message: 'Agent created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/agents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 