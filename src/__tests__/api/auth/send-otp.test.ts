import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/send-otp/route';
import { sendWhatsAppOTP } from '@/lib/twilio/client';

// Mock Twilio client
jest.mock('@/lib/twilio/client', () => ({
  sendWhatsAppOTP: jest.fn()
}));

describe('POST /api/auth/send-otp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send OTP successfully', async () => {
    const mockSendOTP = sendWhatsAppOTP as jest.MockedFunction<typeof sendWhatsAppOTP>;
    mockSendOTP.mockResolvedValueOnce({
      success: true,
      message: 'OTP sent successfully',
      verificationSid: 'test-sid'
    });

    const request = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber: '+1234567890' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'OTP sent successfully'
    });
    expect(mockSendOTP).toHaveBeenCalledWith('+1234567890');
  });

  it('should return error when phone number is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({})
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: 'Phone number is required'
    });
  });

  it('should handle OTP sending failure', async () => {
    const mockSendOTP = sendWhatsAppOTP as jest.MockedFunction<typeof sendWhatsAppOTP>;
    mockSendOTP.mockResolvedValueOnce({
      success: false,
      error: 'Invalid phone number'
    });

    const request = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber: 'invalid' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: 'Invalid phone number'
    });
  });

  it('should handle internal server errors', async () => {
    const mockSendOTP = sendWhatsAppOTP as jest.MockedFunction<typeof sendWhatsAppOTP>;
    mockSendOTP.mockRejectedValueOnce(new Error('Network error'));

    const request = new NextRequest('http://localhost:3000/api/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber: '+1234567890' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({
      success: false,
      error: 'Internal server error'
    });
  });
});