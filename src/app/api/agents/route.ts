import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { AgentFactory } from '@/lib/agents/factory';
import { AgentManager } from '@/lib/agents/manager';
import type { Agent } from '@/lib/agents/types';

export async function GET(request: NextRequest) {
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

    const body = await request.json();
    const { name, type, config } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    // Get factory instance
    const factory = AgentFactory.getInstance();

    // Validate agent type
    const validTypes = ['inventory_monitor', 'alert_generator', 'data_processor', 'report_generator', 'optimization_engine', 'notification_dispatcher'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid agent type' }, { status: 400 });
    }

    // Get default config if not provided
    const agentConfig = config || factory.getDefaultConfig(type);

    // Validate configuration
    if (!factory.validateConfig(type, agentConfig)) {
      return NextResponse.json({ error: 'Invalid agent configuration' }, { status: 400 });
    }

    // Create agent object
    const agent: Agent = {
      id: crypto.randomUUID(),
      name,
      type,
      status: 'active',
      config: agentConfig,
      company_id: profile.company_id,
      created_at: new Date(),
      updated_at: new Date()
    };


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
        last_run: null,
        next_run: null
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