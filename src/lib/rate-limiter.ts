import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private readonly windowSize: number;
  private readonly maxRequests: number;

  constructor(windowSize: number = 60000, maxRequests: number = 100) {
    this.windowSize = windowSize; // 1 minute default
    this.maxRequests = maxRequests; // 100 requests per minute default
  }

  public isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const userLimit = this.store[identifier];

    if (!userLimit) {
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.windowSize,
      };
      return false;
    }

    if (now > userLimit.resetTime) {
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.windowSize,
      };
      return false;
    }

    if (userLimit.count >= this.maxRequests) {
      return true;
    }

    userLimit.count++;
    return false;
  }

  public getRemainingRequests(identifier: string): number {
    const userLimit = this.store[identifier];
    if (!userLimit) return this.maxRequests;
    
    const now = Date.now();
    if (now > userLimit.resetTime) return this.maxRequests;
    
    return Math.max(0, this.maxRequests - userLimit.count);
  }

  public getResetTime(identifier: string): number {
    const userLimit = this.store[identifier];
    if (!userLimit) return Date.now() + this.windowSize;
    
    const now = Date.now();
    if (now > userLimit.resetTime) return now + this.windowSize;
    
    return userLimit.resetTime;
  }

  // Cleanup old entries periodically
  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of Object.entries(this.store)) {
      if (now > value.resetTime) {
        delete this.store[key];
      }
    }
  }
}

// Create rate limiters for different endpoint types
export const analyticsRateLimiter = new RateLimiter(60000, 60); // 60 requests per minute for analytics
export const authRateLimiter = new RateLimiter(300000, 5); // 5 requests per 5 minutes for auth
export const uploadRateLimiter = new RateLimiter(60000, 10); // 10 uploads per minute

export function withRateLimit(
  rateLimiter: RateLimiter,
  getIdentifier: (request: NextRequest) => string = (req) => 
    req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
) {
  return function rateLimitMiddleware(
    handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest, ...args: any[]): Promise<NextResponse> {
      const identifier = getIdentifier(request);
      
      if (rateLimiter.isRateLimited(identifier)) {
        const resetTime = rateLimiter.getResetTime(identifier);
        const remainingTime = Math.ceil((resetTime - Date.now()) / 1000);
        
        return NextResponse.json(
          {
            error: 'Rate limit exceeded',
            message: `Too many requests. Try again in ${remainingTime} seconds.`,
            retryAfter: remainingTime,
          },
          {
            status: 429,
            headers: {
              'Retry-After': remainingTime.toString(),
              'X-RateLimit-Limit': '60',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': resetTime.toString(),
            },
          }
        );
      }

      const remaining = rateLimiter.getRemainingRequests(identifier);
      const resetTime = rateLimiter.getResetTime(identifier);
      
      const response = await handler(request, ...args);
      
      // Add rate limit headers to successful responses
      response.headers.set('X-RateLimit-Limit', '60');
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      response.headers.set('X-RateLimit-Reset', resetTime.toString());
      
      return response;
    };
  };
}

// Helper to get user-specific identifier from Supabase session
export function getUserIdentifier(request: NextRequest): string {
  // Try to get user ID from authorization header or session
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    try {
      const token = authHeader.replace('Bearer ', '');
      // In production, decode JWT to get user ID
      // For now, use a hash of the token
      return `user:${Buffer.from(token).toString('base64').slice(0, 16)}`;
    } catch {
      // Fallback to IP-based limiting
    }
  }
  
  return request.headers.get('x-forwarded-for') || 
         request.headers.get('x-real-ip') || 
         'unknown';
}