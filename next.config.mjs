/** @type {import('next').NextConfig} */
const nextConfig = {
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
