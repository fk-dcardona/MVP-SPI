import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  let res = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes
  const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') || 
                          req.nextUrl.pathname.startsWith('/api/') && 
                          !req.nextUrl.pathname.startsWith('/api/auth') &&
                          !req.nextUrl.pathname.startsWith('/api/test-auth') &&
                          !req.nextUrl.pathname.startsWith('/api/webhooks/')

  if (isProtectedRoute && !session) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Ensure we return the response with updated cookies
  return res
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ]
}