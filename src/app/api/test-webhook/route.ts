import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔗 Test webhook received:', {
      timestamp: new Date().toISOString(),
      body: JSON.stringify(body, null, 2)
    });

    // Simulate WhatsApp webhook format
    const mockWhatsAppMessage = {
      From: body.From || 'whatsapp:+1234567890',
      To: 'whatsapp:+1234567899',
      Body: body.Body || body.message || 'test message',
      MessageSid: 'SM' + Date.now(),
      ProfileName: body.ProfileName || 'Test User'
    };

    console.log('📱 Simulating WhatsApp message:', mockWhatsAppMessage);

    // Test the webhook endpoint
    const webhookResponse = await fetch(`${request.nextUrl.origin}/api/webhooks/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(mockWhatsAppMessage as any)
    });

    const webhookResult = await webhookResponse.text();

    return NextResponse.json({
      success: true,
      message: 'Test webhook processed',
      mockMessage: mockWhatsAppMessage,
      webhookStatus: webhookResponse.status,
      webhookResponse: webhookResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook test failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'WhatsApp Webhook Test Endpoint',
    usage: 'POST with {From, Body, ProfileName} or {message}',
    example: {
      From: 'whatsapp:+1234567890',
      Body: 'check inventory for widgets',
      ProfileName: 'Test User'
    }
  });
}