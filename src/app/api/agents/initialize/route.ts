import { NextRequest, NextResponse } from 'next/server';
import { initializeAgentSystem } from '@/lib/agents/startup';

export async function POST(request: NextRequest) {
  try {
    // Initialize the agent system
    await initializeAgentSystem();
    
    return NextResponse.json({ 
      message: 'Agent system initialized successfully' 
    });
  } catch (error) {
    console.error('Error initializing agent system:', error);
    return NextResponse.json({ 
      error: 'Failed to initialize agent system' 
    }, { status: 500 });
  }
} 