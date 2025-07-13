import { NextResponse } from 'next/server';
import { PostgrestError } from '@supabase/supabase-js';

export interface APIError {
  code: string;
  message: string;
  details?: any;
  statusCode: number;
}

export class APIErrorHandler {
  static handle(error: unknown, context?: string): NextResponse {
    console.error(`API Error ${context ? `in ${context}` : ''}:`, error);
    
    // Handle Supabase PostgrestError
    if (this.isPostgrestError(error)) {
      return this.handlePostgrestError(error);
    }
    
    // Handle standard Error objects
    if (error instanceof Error) {
      return this.handleGenericError(error);
    }
    
    // Handle unknown errors
    return this.handleUnknownError(error);
  }
  
  private static isPostgrestError(error: any): error is PostgrestError {
    return error && typeof error === 'object' && 'code' in error && 'message' in error;
  }
  
  private static handlePostgrestError(error: PostgrestError): NextResponse {
    const errorMap: Record<string, { statusCode: number; userMessage: string }> = {
      'PGRST116': { statusCode: 404, userMessage: 'Resource not found' },
      '42P01': { statusCode: 500, userMessage: 'Service temporarily unavailable' }, // Table doesn't exist
      '42883': { statusCode: 500, userMessage: 'Service temporarily unavailable' }, // Function doesn't exist
      '23505': { statusCode: 409, userMessage: 'Resource already exists' }, // Unique violation
      '23503': { statusCode: 400, userMessage: 'Invalid reference' }, // Foreign key violation
      'row_not_found': { statusCode: 404, userMessage: 'Resource not found' },
      'insufficient_privilege': { statusCode: 403, userMessage: 'Access denied' },
    };
    
    const mapped = errorMap[error.code] || { statusCode: 500, userMessage: 'Database operation failed' };
    
    return NextResponse.json(
      {
        error: mapped.userMessage,
        code: error.code,
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { details: error.details })
      },
      { status: mapped.statusCode }
    );
  }
  
  private static handleGenericError(error: Error): NextResponse {
    // Authentication errors
    if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      return NextResponse.json(
        {
          error: 'Authentication required',
          code: 'AUTH_REQUIRED',
          timestamp: new Date().toISOString(),
        },
        { status: 401 }
      );
    }
    
    // Validation errors
    if (error.message.includes('validation') || error.message.includes('invalid')) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString(),
          ...(process.env.NODE_ENV === 'development' && { details: error.message })
        },
        { status: 400 }
      );
    }
    
    // Network/timeout errors
    if (error.message.includes('timeout') || error.message.includes('network')) {
      return NextResponse.json(
        {
          error: 'Service temporarily unavailable',
          code: 'SERVICE_UNAVAILABLE',
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
    
    // Default to 500 for unknown errors
    return NextResponse.json(
      {
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { details: error.message })
      },
      { status: 500 }
    );
  }
  
  private static handleUnknownError(error: unknown): NextResponse {
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { details: String(error) })
      },
      { status: 500 }
    );
  }
}

// Validation helpers
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateRequired(value: any, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`${fieldName} is required`, fieldName);
  }
}

export function validateSKU(sku: string): void {
  if (!sku || typeof sku !== 'string' || sku.length < 1 || sku.length > 50) {
    throw new ValidationError('SKU must be a string between 1 and 50 characters', 'sku');
  }
}

export function validatePagination(page?: string, limit?: string): { page: number; limit: number } {
  const parsedPage = page ? parseInt(page, 10) : 1;
  const parsedLimit = limit ? parseInt(limit, 10) : 10;
  
  if (isNaN(parsedPage) || parsedPage < 1) {
    throw new ValidationError('Page must be a positive integer', 'page');
  }
  
  if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
    throw new ValidationError('Limit must be between 1 and 100', 'limit');
  }
  
  return { page: parsedPage, limit: parsedLimit };
}

export function validateDays(days?: string): number {
  if (!days) return 30; // Default
  
  const parsedDays = parseInt(days, 10);
  if (isNaN(parsedDays) || parsedDays < 1 || parsedDays > 365) {
    throw new ValidationError('Days must be between 1 and 365', 'days');
  }
  
  return parsedDays;
}

export function validateIndustry(industry?: string): 'retail' | 'manufacturing' | 'distribution' {
  const validIndustries = ['retail', 'manufacturing', 'distribution'] as const;
  
  if (!industry) return 'retail'; // Default
  
  if (!validIndustries.includes(industry as any)) {
    throw new ValidationError(
      `Industry must be one of: ${validIndustries.join(', ')}`,
      'industry'
    );
  }
  
  return industry as 'retail' | 'manufacturing' | 'distribution';
}

// Async wrapper for API route handlers
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return APIErrorHandler.handle(error, context);
    }
  };
}