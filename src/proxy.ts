// src/middleware.ts
// Protects routes that require authentication.
// Runs on every request before the page renders.

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that require auth
const PROTECTED = ['/dashboard', '/applications', '/profile']
// Routes only for guests (redirect to dashboard if already logged in)
const GUEST_ONLY = ['/login', '/signup']

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Not logged in → redirect to login
  if (!user && PROTECTED.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Already logged in → redirect away from login/signup
  if (user && GUEST_ONLY.some(p => path.startsWith(p))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}