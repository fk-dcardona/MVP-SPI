import { sendWhatsAppOTP, verifyWhatsAppOTP, sendWhatsAppNotification } from '@/lib/twilio/client';
import twilio from 'twilio';

// Mock Twilio
jest.mock('twilio', () => {
  const mockClient = {
    messages: {
      create: jest.fn()
    }
  };
  return jest.fn(() => mockClient);
});

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        error: null
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            eq: jest.fn(() => ({
              gte: jest.fn(() => ({
                order: jest.fn(() => ({
                  limit: jest.fn(() => ({
                    single: jest.fn()
                  }))
                }))
              }))
            }))
          }))
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          error: null
        }))
      }))
    }))
  }))
}));

// Mock environment variables
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    TWILIO_ACCOUNT_SID: 'test-account-sid',
    TWILIO_AUTH_TOKEN: 'test-auth-token',
    TWILIO_WHATSAPP_NUMBER: 'whatsapp:+15551234567'
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Twilio Client', () => {
  let mockTwilioClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTwilioClient = twilio();
  });

  describe('sendWhatsAppOTP', () => {
    it('should send OTP successfully', async () => {
      mockTwilioClient.messages.create.mockResolvedValueOnce({
        sid: 'message-sid-123'
      });

      const result = await sendWhatsAppOTP('+1234567890');

      expect(result).toEqual({
        success: true,
        message: 'OTP sent successfully',
        verificationSid: 'message-sid-123'
      });

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expect.stringContaining('Your Finkargo verification code is:'),
        from: 'whatsapp:+15551234567',
        to: 'whatsapp:+1234567890'
      });
    });

    it('should add country code if missing', async () => {
      mockTwilioClient.messages.create.mockResolvedValueOnce({
        sid: 'message-sid-123'
      });

      await sendWhatsAppOTP('1234567890');

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: expect.any(String),
        from: 'whatsapp:+15551234567',
        to: 'whatsapp:+1234567890'
      });
    });

    it('should handle Twilio errors', async () => {
      mockTwilioClient.messages.create.mockRejectedValueOnce(
        new Error('Invalid phone number')
      );

      const result = await sendWhatsAppOTP('+invalid');

      expect(result).toEqual({
        success: false,
        error: 'Invalid phone number'
      });
    });
  });

  describe('verifyWhatsAppOTP', () => {
    it('should verify valid OTP', async () => {
      const mockSupabase = require('@/lib/supabase/server').createServerClient();
      
      // Mock finding valid OTP
      mockSupabase.from().select().eq().eq().eq().gte().order().limit().single
        .mockResolvedValueOnce({
          data: {
            id: 'otp-123',
            otp_code: '123456',
            phone_number: '+1234567890',
            is_used: false,
            expires_at: new Date(Date.now() + 300000).toISOString()
          },
          error: null
        });

      const result = await verifyWhatsAppOTP('+1234567890', '123456');

      expect(result).toEqual({
        success: true,
        message: 'OTP verified successfully',
        isValid: true
      });
    });

    it('should reject invalid OTP', async () => {
      const mockSupabase = require('@/lib/supabase/server').createServerClient();
      
      // Mock not finding OTP
      mockSupabase.from().select().eq().eq().eq().gte().order().limit().single
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' }
        });

      const result = await verifyWhatsAppOTP('+1234567890', '000000');

      expect(result).toEqual({
        success: false,
        error: 'Invalid or expired OTP',
        isValid: false
      });
    });

    it('should reject expired OTP', async () => {
      const mockSupabase = require('@/lib/supabase/server').createServerClient();
      
      // Mock finding expired OTP
      mockSupabase.from().select().eq().eq().eq().gte().order().limit().single
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Not found' }
        });

      const result = await verifyWhatsAppOTP('+1234567890', '123456');

      expect(result).toEqual({
        success: false,
        error: 'Invalid or expired OTP',
        isValid: false
      });
    });
  });

  describe('sendWhatsAppNotification', () => {
    it('should send notification successfully', async () => {
      mockTwilioClient.messages.create.mockResolvedValueOnce({
        sid: 'message-sid-456'
      });

      const result = await sendWhatsAppNotification(
        '+1234567890',
        'Your inventory is running low!'
      );

      expect(result).toEqual({ success: true });

      expect(mockTwilioClient.messages.create).toHaveBeenCalledWith({
        body: 'Your inventory is running low!',
        from: 'whatsapp:+15551234567',
        to: 'whatsapp:+1234567890'
      });
    });

    it('should handle notification errors', async () => {
      mockTwilioClient.messages.create.mockRejectedValueOnce(
        new Error('Rate limit exceeded')
      );

      const result = await sendWhatsAppNotification(
        '+1234567890',
        'Test message'
      );

      expect(result).toEqual({
        success: false,
        error: 'Rate limit exceeded'
      });
    });

    it('should return error when Twilio is not configured', async () => {
      // Temporarily remove env vars
      const tempSid = process.env.TWILIO_ACCOUNT_SID;
      delete process.env.TWILIO_ACCOUNT_SID;

      const result = await sendWhatsAppNotification(
        '+1234567890',
        'Test message'
      );

      expect(result).toEqual({
        success: false,
        error: 'WhatsApp service not configured'
      });

      // Restore env var
      process.env.TWILIO_ACCOUNT_SID = tempSid;
    });
  });
});