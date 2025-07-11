import { createClient } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    const supabase = createClient();
    
    // Test the connection
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        errorDetails: error
      }, { status: 401 });
    }

    return NextResponse.json({ 
      success: true, 
      user: data.user,
      session: data.session ? 'Active' : 'No session'
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error',
      stack: error.stack
    }, { status: 500 });
  }
}