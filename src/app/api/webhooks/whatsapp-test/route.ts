import { NextRequest, NextResponse } from 'next/server';

// Simple test webhook to verify Twilio integration
export async function POST(request: NextRequest) {
  try {
    console.log('🎯 WhatsApp Test Webhook Hit!');
    
    // Parse form data
    const formData = await request.formData();
    const message = {
      from: formData.get('From') as string,
      body: formData.get('Body') as string,
      profileName: formData.get('ProfileName') as string,
    };
    
    console.log('📱 Message received:', {
      from: message.from,
      body: message.body,
      profileName: message.profileName,
      timestamp: new Date().toISOString()
    });

    // Simple response for testing
    const responseMessage = `Hello! I received your message: "${message.body}". The conversational AI is being set up.`;
    
    // Return TwiML response
    return new NextResponse(
      `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Message>${responseMessage}</Message>
      </Response>`,
      { 
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      }
    );

  } catch (error) {
    console.error('❌ WhatsApp test webhook error:', error);
    
    // Return empty response to prevent Twilio retries
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { 
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      }
    );
  }
}

// Handle GET requests for testing
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'WhatsApp test webhook is running',
    timestamp: new Date().toISOString()
  });
}