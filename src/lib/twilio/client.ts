import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken || !whatsappNumber) {
  console.warn('Twilio credentials not configured');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SendOTPResult {
  success: boolean;
  message?: string;
  error?: string;
  verificationSid?: string;
}

export interface VerifyOTPResult {
  success: boolean;
  message?: string;
  error?: string;
  isValid?: boolean;
}

/**
 * Generate a 6-digit OTP
 */
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP via WhatsApp
 */
export async function sendWhatsAppOTP(phoneNumber: string): Promise<SendOTPResult> {
  if (!client || !whatsappNumber) {
    return {
      success: false,
      error: 'WhatsApp service not configured'
    };
  }

  try {
    // Ensure phone number includes country code
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    const otp = generateOTP();
    
    // Store OTP in a temporary store (in production, use Redis or database)
    // For now, we'll use Supabase to store it
    const { createServerClient } = await import('@/lib/supabase/server');
    const supabase = createServerClient();
    
    // Store OTP with 10-minute expiration
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    
    const { error: storeError } = await supabase
      .from('otp_verifications')
      .insert({
        phone_number: formattedPhone,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
        is_used: false
      });
    
    if (storeError) {
      console.error('Error storing OTP:', storeError);
      return {
        success: false,
        error: 'Failed to generate OTP'
      };
    }
    
    // Send OTP via WhatsApp
    const message = await client.messages.create({
      body: `Your Finkargo verification code is: ${otp}\n\nThis code will expire in 10 minutes.`,
      from: whatsappNumber,
      to: `whatsapp:${formattedPhone}`
    });
    
    return {
      success: true,
      message: 'OTP sent successfully',
      verificationSid: message.sid
    };
  } catch (error) {
    console.error('Error sending WhatsApp OTP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send OTP'
    };
  }
}

/**
 * Verify OTP code
 */
export async function verifyWhatsAppOTP(phoneNumber: string, otpCode: string): Promise<VerifyOTPResult> {
  try {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    const { createServerClient } = await import('@/lib/supabase/server');
    const supabase = createServerClient();
    
    // Check OTP in database
    const { data: otpRecord, error: fetchError } = await supabase
      .from('otp_verifications')
      .select('*')
      .eq('phone_number', formattedPhone)
      .eq('otp_code', otpCode)
      .eq('is_used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (fetchError || !otpRecord) {
      return {
        success: false,
        error: 'Invalid or expired OTP',
        isValid: false
      };
    }
    
    // Mark OTP as used
    const { error: updateError } = await supabase
      .from('otp_verifications')
      .update({ is_used: true })
      .eq('id', otpRecord.id);
    
    if (updateError) {
      console.error('Error marking OTP as used:', updateError);
    }
    
    return {
      success: true,
      message: 'OTP verified successfully',
      isValid: true
    };
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify OTP',
      isValid: false
    };
  }
}

/**
 * Send a general WhatsApp notification
 */
export async function sendWhatsAppNotification(
  phoneNumber: string, 
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (!client || !whatsappNumber) {
    return {
      success: false,
      error: 'WhatsApp service not configured'
    };
  }

  try {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    await client.messages.create({
      body: message,
      from: whatsappNumber,
      to: `whatsapp:${formattedPhone}`
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notification'
    };
  }
}