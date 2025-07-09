import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { AgentManager } from '@/lib/agents/manager'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    const { uploadId } = body

    // Get or create data processor agent
    const manager = AgentManager.getInstance()
    
    // Find data processor agent
    const { data: agents } = await supabase
      .from('agents')
      .select('*')
      .eq('type', 'data-processor')
      .eq('company_id', session.user.user_metadata.company_id)
      .single()

    if (!agents) {
      return NextResponse.json({ 
        error: 'Data processor agent not found. Please initialize agents first.' 
      }, { status: 404 })
    }

    // Execute the agent with context
    const result = await manager.executeAgent(agents.id, { uploadId })

    if (result.status === 'failed') {
      return NextResponse.json({ 
        error: result.error 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data: result.result 
    })

  } catch (error) {
    console.error('Data processor execution error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}