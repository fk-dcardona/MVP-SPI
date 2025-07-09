import { NextRequest, NextResponse } from 'next/server';
import { verifyWhatsAppOTP } from '@/lib/twilio/client';

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, otp } = await request.json();

    if (!phoneNumber || !otp) {
      return NextResponse.json(
        { success: false, error: 'Phone number and OTP are required' },
        { status: 400 }
      );
    }

    const result = await verifyWhatsAppOTP(phoneNumber, otp);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        isValid: result.isValid,
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error, isValid: false },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in verify-otp route:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}