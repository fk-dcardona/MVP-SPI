import { NextRequest, NextResponse } from 'next/server';

// Ultra-simple webhook test - no dependencies
export async function POST(request: NextRequest) {
  console.log('🎯 Test webhook hit!');
  return NextResponse.json({ status: 'ok' }, { status: 200 });
}

export async function GET(request: NextRequest) {
  console.log('🎯 Test webhook GET hit!');
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Webhook test endpoint is working',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}