import { CloudOff } from 'lucide-react'

import { OfflineRetryButton } from '@/components/shared/offline-retry-button'

/**
 * Offline fallback, served by the service worker when a navigation can reach
 * neither the network nor the cache.
 *
 * Three constraints shape this file, all load-bearing:
 *
 *  1. FULLY STATIC. It is precached at SW install time, so whatever HTML is
 *     captured then must stay valid indefinitely. No fetching, no dynamic
 *     rendering, no request-time data.
 *
 *  2. NO AUTH-STORE READ, and no AppShell. This page renders precisely when
 *     there is no network — so no session can be validated. A component that
 *     redirected an apparently-unauthenticated visitor to /auth/login would
 *     bounce every offline user to a login page that also cannot load. It
 *     inherits only the root layout, deliberately.
 *
 *  3. REACHABLE LOGGED OUT. `offline$` is excluded from the proxy matcher
 *     (added in SF5) so this returns 200 rather than a 307 to /auth/login.
 *
 * It is a server component with no interactivity: the retry button is a plain
 * anchor, so it needs no client bundle and works with JS still warming up.
 */

export const dynamic = 'force-static'

export const metadata = {
  title: 'Offline',
  description: 'You are offline',
}

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-sm text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <CloudOff className="h-7 w-7" />
        </span>

        <h1 className="text-xl font-semibold text-slate-800">You&apos;re offline</h1>

        <p className="mt-2 text-sm text-slate-500">
          This page hasn&apos;t been opened on this device yet, so there&apos;s
          nothing saved to show. Pages you&apos;ve already visited will still
          load.
        </p>

        {/* Retries the URL the user actually asked for, not a fixed route: the
            SW serves this page in response to a failed navigation while the
            address bar still shows the requested path, so location.reload()
            re-attempts that exact request. Falls back to a plain link so it
            still works before hydration and with JS disabled. */}
        <OfflineRetryButton />
      </div>
    </main>
  )
}
