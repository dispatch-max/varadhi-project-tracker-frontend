/**
 * PWA manifest (Next metadata route -> /manifest.webmanifest)
 *
 * A route rather than a static public/ file so the app's identity lives in one
 * place alongside the rest of the metadata.
 *
 * NOTE: /manifest.webmanifest must be reachable WITHOUT authentication —
 * browsers fetch it during first paint, often before any auth state exists, and
 * the OS installer fetches the icons entirely outside the page's auth context.
 * src/proxy.js excludes it (and /icons/) from the auth matcher for exactly this
 * reason; without that the manifest 307s to the login page, parses as HTML, and
 * the app is silently not installable.
 */

export default function manifest() {
  return {
    id: '/',
    name: 'Varadhi Project Tracker',
    short_name: 'Varadhi',
    description: 'Plan, track and deliver projects with your team.',
    // Deep-link straight past the marketing-free root redirect. Logged-out
    // users still land on /auth/login via proxy.js.
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#ffffff',
    // violet-600 — the accent the UI already uses for active nav and unread badges.
    theme_color: '#7c3aed',
    categories: ['productivity', 'business'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      // Maskable variants keep the mark inside the safe zone so Android
      // launchers can crop to any shape without clipping it.
      {
        src: '/icons/icon-192-maskable.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
