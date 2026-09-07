import { NextResponse } from 'next/server'

// These pages don't need login
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/accept-invite'
]

/*
 * This gate reads a HINT cookie, not a credential.
 *
 * It structurally cannot read the real ones: varadhi_access and varadhi_refresh
 * are set by the API on the Render origin, and this middleware runs on the
 * Vercel origin — a cookie set by one registrable domain is never sent to
 * another. So `varadhi_token` is a first-party flag containing the literal "1",
 * written by lib/auth-hint.js. It previously held the actual access token,
 * which put a real credential within reach of any XSS and expired after 15
 * minutes, bouncing signed-in users to the login page every quarter hour.
 *
 * This is a redirect optimisation, NOT authorisation. Anyone can set the cookie
 * by hand; all it gets them is the client shell of a page whose every API call
 * still 401s. Real enforcement is the backend's `protect` + `restrictTo`.
 */
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
  // PWA assets MUST be reachable while logged out, or the app is silently not
  // installable — with no error surfaced anywhere:
  //
  //   sw.js                 browsers refuse to register a service worker that
  //                         redirects to an HTML login page
  //   manifest.webmanifest  fetched during first paint, often before any auth
  //                         state exists; a 307 makes it parse as HTML
  //   icons/, apple-touch-icon
  //                         the OS installer fetches these entirely outside the
  //                         page's auth context
  //   offline               the fallback page must render when there is no
  //                         network to redirect over (used from SF6)
  //
  // `offline$` is anchored so a future /offline-report stays auth-protected.
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|icons/|apple-touch-icon|offline$|robots.txt|sitemap.xml).*)',
  ],
}