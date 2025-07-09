import { NextRequest } from 'next/server';
import { POST } from '@/app/api/auth/verify-otp/route';
import { verifyWhatsAppOTP } from '@/lib/twilio/client';

// Mock Twilio client
jest.mock('@/lib/twilio/client', () => ({
  verifyWhatsAppOTP: jest.fn()
}));

describe('POST /api/auth/verify-otp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should verify OTP successfully', async () => {
    const mockVerifyOTP = verifyWhatsAppOTP as jest.MockedFunction<typeof verifyWhatsAppOTP>;
    mockVerifyOTP.mockResolvedValueOnce({
      success: true,
      message: 'OTP verified successfully',
      isValid: true
    });

    const request = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ 
        phoneNumber: '+1234567890',
        otp: '123456'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      success: true,
      message: 'OTP verified successfully',
      isValid: true
    });
    expect(mockVerifyOTP).toHaveBeenCalledWith('+1234567890', '123456');
  });

  it('should return error when phone number is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ otp: '123456' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: 'Phone number and OTP are required'
    });
  });

  it('should return error when OTP is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phoneNumber: '+1234567890' })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: 'Phone number and OTP are required'
    });
  });

  it('should handle invalid OTP', async () => {
    const mockVerifyOTP = verifyWhatsAppOTP as jest.MockedFunction<typeof verifyWhatsAppOTP>;
    mockVerifyOTP.mockResolvedValueOnce({
      success: false,
      error: 'Invalid or expired OTP',
      isValid: false
    });

    const request = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ 
        phoneNumber: '+1234567890',
        otp: '000000'
      })
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({
      success: false,
      error: 'Invalid or expired OTP',
      isValid: false
    });
  });

  it('should handle internal server errors', async () => {
    const mockVerifyOTP = verifyWhatsAppOTP as jest.MockedFunction<typeof verifyWhatsAppOTP>;
    mockVerifyOTP.mockRejectedValueOnce(new Error('Database error'));

    const request = new NextRequest('http://localhost:3000/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ 
        phoneNumber: '+1234567890',
        otp: '123456'
      })
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