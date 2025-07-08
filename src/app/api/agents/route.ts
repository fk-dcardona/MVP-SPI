import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { AgentFactory } from '@/lib/agents/factory';
import { AgentManager } from '@/lib/agents/manager';
import type { Agent } from '@/lib/agents/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
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
    const supabase = await createClient();
    
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
    let agent: Agent;
    try {
      switch (type) {
        case 'inventory_monitor':
          agent = AgentFactory.createInventoryMonitorAgent(name, profile.company_id, config);
          break;
        case 'alert_generator':
          agent = AgentFactory.createAlertGeneratorAgent(name, profile.company_id, config);
          break;
        case 'data_processor':
          agent = AgentFactory.createDataProcessorAgent(name, profile.company_id, config);
          break;
        case 'report_generator':
          agent = AgentFactory.createReportGeneratorAgent(name, profile.company_id, config);
          break;
        case 'optimization_engine':
          agent = AgentFactory.createOptimizationEngineAgent(name, profile.company_id, config);
          break;
        case 'notification_dispatcher':
          agent = AgentFactory.createNotificationDispatcherAgent(name, profile.company_id, config);
          break;
        default:
          return NextResponse.json({ error: 'Invalid agent type' }, { status: 400 });
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
    }

    // Validate agent configuration
    const validation = AgentFactory.validateAgentConfig(agent);
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid agent configuration', 
        details: validation.errors 
      }, { status: 400 });
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
        last_run: agent.lastRun?.toISOString(),
        next_run: agent.nextRun?.toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting agent:', insertError);
      return NextResponse.json({ error: 'Failed to create agent' }, { status: 500 });
    }

    // Initialize agent manager if not already running
    const agentManager = AgentManager.getInstance();
    await agentManager.initialize();

    return NextResponse.json({ 
      agent: insertedAgent,
      message: 'Agent created successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/agents:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 