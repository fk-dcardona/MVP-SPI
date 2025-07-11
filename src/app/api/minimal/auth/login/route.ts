import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Hardcoded test users for minimal viable flow
const TEST_USERS = [
  {
    email: 'test@finkargo.com',
    password: 'Test123!@#',
    id: '1',
    name: 'Test User',
    company: 'Test Trading Co',
  },
  {
    email: 'admin@demo.com',
    password: 'demo123',
    id: '2',
    name: 'Admin User',
    company: 'Demo Company',
  },
];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Simple validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user (in production, this would check against a database)
    const user = TEST_USERS.find(
      (u) => u.email === email && u.password === password
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create a simple session token (in production, use proper JWT)
    const sessionToken = Buffer.from(
      JSON.stringify({
        userId: user.id,
        email: user.email,
        company: user.company,
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      })
    ).toString('base64');

    // Set session cookie
    cookies().set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours in seconds
      path: '/',
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}