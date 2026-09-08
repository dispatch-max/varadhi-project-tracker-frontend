/*
 * Backend origin. Server-side only — deliberately NOT NEXT_PUBLIC_*, because
 * the browser must never be told this URL. The whole point of the rewrite below
 * is that the browser only ever talks to this Vercel origin.
 */
const BACKEND_ORIGIN =
  process.env.BACKEND_ORIGIN ||
  (process.env.NODE_ENV === 'development'
    ? 'http://localhost:5000'
    : 'https://varadhi-project-tracker.onrender.com')

/** @type {import('next').NextConfig} */
const nextConfig = {
  /*
   * SAME-ORIGIN API PROXY — this is what makes authentication work at all.
   *
   * THE PROBLEM IT SOLVES
   * The frontend is served from *.vercel.app and the API from *.onrender.com.
   * Those are different registrable domains, so an auth cookie set by the API
   * is a THIRD-PARTY cookie from the browser's point of view. Safari (iOS and
   * macOS) has blocked all third-party cookies by default since 2020, Chrome
   * blocks them on Android/incognito and under common privacy settings, and
   * managed corporate browsers usually block them by policy.
   *
   * The server was doing everything correctly — HttpOnly, Secure,
   * SameSite=None, correct CORS, no Domain attribute. It made no difference:
   * SameSite=None makes a cookie ELIGIBLE to be sent cross-site, it does not
   * make a browser willing to STORE it. Login returned 200, the browser threw
   * the Set-Cookie away, the next request had no credential, and the user was
   * bounced back to the login page. It appeared to work only in browsers that
   * still permit third-party cookies.
   *
   * Cookie-attribute tuning cannot fix this, and neither can a shared parent
   * domain: vercel.app and onrender.com are both on the Public Suffix List, so
   * Domain=.vercel.app is forbidden and there is no common ancestor.
   *
   * HOW THIS FIXES IT
   * Requests go to /api/* on THIS origin; Vercel proxies them to the backend
   * server-side. The browser sees one origin, so the auth cookies are
   * first-party and every browser stores them normally. Nothing about the
   * security model changes: still HttpOnly, still Secure, same rotation,
   * revocation and CSRF guard.
   *
   * NOTE: `proxy.js`'s matcher already excludes /api, so Next middleware does
   * not intercept these.
   */
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${BACKEND_ORIGIN}/api/:path*`,
      },
    ]
  },

  async headers() {
    return [
      {
        // The service worker is versioned by its own contents: the browser
        // byte-compares /sw.js on navigation and reinstalls on any diff. That
        // only works if the file is actually revalidated — a CDN or browser
        // caching it for hours would pin a stale worker (and, from SF6, a
        // stale cache-invalidation routine) with no way to recover.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
      {
        // Same reasoning: an install prompt driven by a stale manifest would
        // keep pointing at old icons or an old start_url.
        source: '/manifest.webmanifest',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ]
  },
}

export default nextConfig
