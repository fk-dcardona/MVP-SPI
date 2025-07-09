import { NextRequest } from 'next/server';
import { middleware } from '@/middleware';

// Mock Supabase
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn()
    }
  }))
}));

describe('Middleware', () => {
  const mockRequest = (pathname: string, authenticated = false) => {
    const request = new NextRequest(new URL(`http://localhost:3000${pathname}`));
    
    const { createServerClient } = require('@supabase/ssr');
    const mockSupabase = createServerClient();
    
    if (authenticated) {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'test-user-id', email: 'test@example.com' } },
        error: null
      });
    } else {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      });
    }
    
    return request;
  };

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users to login for dashboard', async () => {
      const request = mockRequest('/dashboard', false);
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login?redirect=%2Fdashboard');
    });

    it('should allow authenticated users to access dashboard', async () => {
      const request = mockRequest('/dashboard', true);
      const response = await middleware(request);
      
      expect(response.status).toBe(200);
    });

    it('should protect API routes', async () => {
      const request = mockRequest('/api/agents', false);
      const response = await middleware(request);
      
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toBe('Unauthorized');
    });

    it('should allow authenticated users to access API routes', async () => {
      const request = mockRequest('/api/agents', true);
      const response = await middleware(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('x-user-id')).toBe('test-user-id');
    });
  });

  describe('Auth Routes', () => {
    it('should redirect authenticated users from login to dashboard', async () => {
      const request = mockRequest('/login', true);
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard');
    });

    it('should allow unauthenticated users to access login', async () => {
      const request = mockRequest('/login', false);
      const response = await middleware(request);
      
      expect(response.status).toBe(200);
    });

    it('should redirect authenticated users from register to dashboard', async () => {
      const request = mockRequest('/register', true);
      const response = await middleware(request);
      
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/dashboard');
    });

    it('should allow unauthenticated users to access register', async () => {
      const request = mockRequest('/register', false);
      const response = await middleware(request);
      
      expect(response.status).toBe(200);
    });
  });

  describe('Public Routes', () => {
    it('should allow access to public routes without authentication', async () => {
      const request = mockRequest('/', false);
      const response = await middleware(request);
      
      expect(response.status).toBe(200);
    });

    it('should not interfere with static assets', async () => {
      const request = mockRequest('/_next/static/chunk.js', false);
      const response = await middleware(request);
      
      expect(response.status).toBe(200);
    });
  });
});