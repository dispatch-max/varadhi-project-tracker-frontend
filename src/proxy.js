import { NextResponse } from 'next/server'

// These pages don't need login
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/accept-invite'
]

export function proxy(request) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('varadhi_token')?.value

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  // Not logged in + trying to access private page → go to login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // Already logged in + trying to access auth pages → go to dashboard
  if (token && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Root path → redirect based on login status
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(token ? '/dashboard' : '/auth/login', request.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}