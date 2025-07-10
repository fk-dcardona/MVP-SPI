import { NextResponse } from 'next/server';
import { getSupabaseAdmin, checkDatabaseConnection } from '@/lib/db/connection';

export const runtime = 'edge';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: {
      status: 'up' | 'down';
      latency?: number;
    };
    storage: {
      status: 'up' | 'down';
    };
    auth: {
      status: 'up' | 'down';
    };
  };
  metrics?: {
    uptime: number;
    memory: {
      used: number;
      total: number;
    };
  };
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const dbStart = Date.now();
    const isDatabaseHealthy = await checkDatabaseConnection();
    const dbLatency = Date.now() - dbStart;
    
    // Prepare health status
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: {
          status: isDatabaseHealthy ? 'up' : 'down',
          latency: dbLatency,
        },
        storage: {
          status: 'up', // Assume storage is up if database is up
        },
        auth: {
          status: 'up', // Assume auth is up if database is up
        },
      },
    };
    
    // Add metrics in non-production environments
    if (process.env.NODE_ENV !== 'production') {
      health.metrics = {
        uptime: process.uptime(),
        memory: {
          used: process.memoryUsage().heapUsed / 1024 / 1024,
          total: process.memoryUsage().heapTotal / 1024 / 1024,
        },
      };
    }
    
    // Determine overall health status
    if (!isDatabaseHealthy) {
      health.status = 'unhealthy';
    } else if (dbLatency > 5000) {
      health.status = 'degraded';
    }
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(health, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Response-Time': `${Date.now() - startTime}ms`,
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: { status: 'down' },
        storage: { status: 'down' },
        auth: { status: 'down' },
      },
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined,
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}

// Ready check endpoint for Kubernetes/container orchestration
export async function HEAD() {
  try {
    const isDatabaseHealthy = await checkDatabaseConnection();
    return new Response(null, { status: isDatabaseHealthy ? 200 : 503 });
  } catch {
    return new Response(null, { status: 503 });
  }
}