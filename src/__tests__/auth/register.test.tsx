import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import RegisterFormEnhanced from '@/components/auth/RegisterFormEnhanced';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    })),
    auth: {
      signUp: jest.fn()
    }
  }))
}));

// Mock fetch for OTP
global.fetch = jest.fn();

describe('RegisterFormEnhanced', () => {
  const mockPush = jest.fn();
  const mockSupabase = require('@/lib/supabase/client').createClient();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush
    });
    jest.clearAllMocks();
  });

  it('renders registration form with all fields', () => {
    render(<RegisterFormEnhanced />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/whatsapp number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/industry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<RegisterFormEnhanced />);

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
      expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
    });
  });

  it('validates password confirmation', async () => {
    const user = userEvent.setup();
    render(<RegisterFormEnhanced />);

    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password456');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    const user = userEvent.setup();
    render(<RegisterFormEnhanced />);

    await user.type(screen.getByLabelText(/whatsapp number/i), '123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter a valid phone number/i)).toBeInTheDocument();
    });
  });

  it('creates new company and user on successful registration', async () => {
    const user = userEvent.setup();
    
    // Mock successful company check (not found)
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: null,
      error: null
    });

    // Mock successful company creation
    mockSupabase.from().insert().select().single.mockResolvedValueOnce({
      data: { id: 'company-123' },
      error: null
    });

    // Mock successful user signup
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null
    });

    // Mock successful OTP send
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, message: 'OTP sent' })
    });

    render(<RegisterFormEnhanced />);

    // Fill form
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/whatsapp number/i), '+1234567890');
    await user.type(screen.getByLabelText(/company name/i), 'Acme Corp');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');

    // Select industry
    await user.click(screen.getByLabelText(/industry/i));
    await user.click(screen.getByText('Technology'));

    // Submit
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'john@example.com',
        password: 'password123',
        options: {
          data: {
            full_name: 'John Doe',
            phone_number: '+1234567890',
            company_id: 'company-123',
            role: 'analyst'
          }
        }
      });
    });

    // Should show OTP verification step
    await waitFor(() => {
      expect(screen.getByText(/verification code/i)).toBeInTheDocument();
    });
  });

  it('handles OTP verification', async () => {
    const user = userEvent.setup();
    
    // Setup mocks for registration flow
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: null,
      error: null
    });
    mockSupabase.from().insert().select().single.mockResolvedValueOnce({
      data: { id: 'company-123' },
      error: null
    });
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true })
    });

    render(<RegisterFormEnhanced />);

    // Complete registration to get to OTP step
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/whatsapp number/i), '+1234567890');
    await user.type(screen.getByLabelText(/company name/i), 'Acme Corp');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByLabelText(/industry/i));
    await user.click(screen.getByText('Technology'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for OTP screen
    await waitFor(() => {
      expect(screen.getByLabelText(/verification code/i)).toBeInTheDocument();
    });

    // Mock OTP verification success
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true, isValid: true })
    });

    // Mock profile update
    mockSupabase.auth.getUser = jest.fn().mockResolvedValueOnce({
      data: { user: { id: 'user-123' } }
    });
    mockSupabase.from().update = jest.fn(() => ({
      eq: jest.fn().mockResolvedValueOnce({ error: null })
    }));

    // Enter OTP
    await user.type(screen.getByLabelText(/verification code/i), '123456');
    await user.click(screen.getByRole('button', { name: /verify code/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('allows skipping WhatsApp verification', async () => {
    const user = userEvent.setup();
    
    // Setup mocks to reach OTP screen
    mockSupabase.from().select().eq().single.mockResolvedValueOnce({
      data: null,
      error: null
    });
    mockSupabase.from().insert().select().single.mockResolvedValueOnce({
      data: { id: 'company-123' },
      error: null
    });
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ success: true })
    });

    render(<RegisterFormEnhanced />);

    // Complete registration
    await user.type(screen.getByLabelText(/full name/i), 'John Doe');
    await user.type(screen.getByLabelText(/email/i), 'john@example.com');
    await user.type(screen.getByLabelText(/whatsapp number/i), '+1234567890');
    await user.type(screen.getByLabelText(/company name/i), 'Acme Corp');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password123');
    await user.click(screen.getByLabelText(/industry/i));
    await user.click(screen.getByText('Technology'));
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Wait for OTP screen
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /skip for now/i })).toBeInTheDocument();
    });

    // Click skip
    await user.click(screen.getByRole('button', { name: /skip for now/i }));

    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });
});