import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = cookies().get('session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Decode session (in production, verify JWT properly)
    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, 'base64').toString()
    );

    // Check if session is expired
    if (sessionData.expires < Date.now()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: {
        id: sessionData.userId,
        email: sessionData.email,
        name: sessionData.email.split('@')[0], // Simple name extraction
        company: sessionData.company,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid session' },
      { status: 401 }
    );
  }
}