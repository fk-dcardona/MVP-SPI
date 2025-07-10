import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { WhatsAppMessageProcessor } from '@/lib/whatsapp/message-processor';
import { WhatsAppService } from '@/lib/notifications/whatsapp-service';
import { createServerClient } from '@/lib/supabase/server';

// Twilio webhook payload interface
interface TwilioWebhookPayload {
  From: string;           // WhatsApp number (e.g., "whatsapp:+1234567890")
  To: string;             // Your Twilio WhatsApp number
  Body: string;           // Message text
  MessageSid: string;     // Unique message ID
  AccountSid: string;     // Twilio account ID
  NumMedia?: string;      // Number of media attachments
  MediaUrl0?: string;     // First media URL (if any)
  ProfileName?: string;   // WhatsApp profile name
}

// Validate Twilio webhook signature
async function validateTwilioRequest(request: NextRequest, params: URLSearchParams): Promise<boolean> {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get('X-Twilio-Signature');
  
  if (!authToken || !signature) {
    console.error('Missing auth token or signature');
    return false;
  }

  const url = request.url;
  
  // Sort parameters and concatenate
  const sortedParams = Array.from(params.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}${value}`)
    .join('');

  // Calculate expected signature
  const data = url + sortedParams;
  const expectedSignature = crypto
    .createHmac('sha1', authToken)
    .update(data)
    .digest('base64');

  return signature === expectedSignature;
}

// Rate limiting
const rateLimiter = new Map<string, { count: number; resetAt: Date }>();

function checkRateLimit(phoneNumber: string): boolean {
  const now = new Date();
  const limit = rateLimiter.get(phoneNumber);
  
  if (!limit || limit.resetAt < now) {
    rateLimiter.set(phoneNumber, {
      count: 1,
      resetAt: new Date(now.getTime() + 60000) // 1 minute window
    });
    return true;
  }
  
  if (limit.count >= 10) { // 10 messages per minute
    return false;
  }
  
  limit.count++;
  return true;
}

// Handle incoming WhatsApp messages
export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const params = new URLSearchParams();
    
    // Convert FormData to URLSearchParams for validation
    formData.forEach((value, key) => {
      params.append(key, value.toString());
    });

    // Validate Twilio signature (skip in development)
    if (process.env.NODE_ENV === 'production') {
      const isValid = await validateTwilioRequest(request, params);
      if (!isValid) {
        console.error('Invalid Twilio signature');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Extract message data
    const message = {
      from: formData.get('From') as string,
      to: formData.get('To') as string,
      body: formData.get('Body') as string,
      messageSid: formData.get('MessageSid') as string,
      accountSid: formData.get('AccountSid') as string,
      profileName: formData.get('ProfileName') as string,
      numMedia: formData.get('NumMedia') as string,
      mediaUrl: formData.get('MediaUrl0') as string,
    };

    console.log('WhatsApp message received:', {
      from: message.from,
      messageSid: message.messageSid,
      body: message.body.substring(0, 50) + '...',
    });

    // Check rate limit
    const phoneNumber = message.from.replace('whatsapp:', '');
    if (!checkRateLimit(phoneNumber)) {
      console.warn('Rate limit exceeded for:', phoneNumber);
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        { 
          status: 200,
          headers: { 'Content-Type': 'text/xml' }
        }
      );
    }

    // Store conversation in database
    const supabase = createServerClient();
    await supabase.from('whatsapp_conversations').insert({
      phone_number: phoneNumber,
      message_sid: message.messageSid,
      message_body: message.body,
      created_at: new Date().toISOString()
    });

    // Process message asynchronously
    const processor = new WhatsAppMessageProcessor();
    processor.processMessage({
      from: message.from,
      to: message.to,
      body: message.body,
      messageSid: message.messageSid,
      profileName: message.profileName,
    }).catch(error => {
      console.error('Error processing WhatsApp message:', error);
    });

    // Send immediate acknowledgment (Twilio expects empty response for async processing)
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { 
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      }
    );

  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    
    // Return empty response to prevent Twilio retries on error
    return new NextResponse(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      { 
        status: 200,
        headers: { 'Content-Type': 'text/xml' }
      }
    );
  }
}

// Handle Twilio status callbacks
export async function GET(request: NextRequest) {
  try {
    // This endpoint can be used for Twilio status callbacks
    const searchParams = request.nextUrl.searchParams;
    const messageSid = searchParams.get('MessageSid');
    const messageStatus = searchParams.get('MessageStatus');

    console.log('WhatsApp status callback:', {
      messageSid,
      messageStatus
    });

    // Update message status in database if needed
    if (messageSid && messageStatus) {
      const supabase = createServerClient();
      await supabase
        .from('whatsapp_conversations')
        .update({ 
          delivery_status: messageStatus,
          updated_at: new Date().toISOString()
        })
        .eq('message_sid', messageSid);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('WhatsApp status callback error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}