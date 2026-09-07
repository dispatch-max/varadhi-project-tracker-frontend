'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

import { ServiceWorkerRegistrar } from '@/components/shared/service-worker-registrar'
import { SessionGuard } from '@/components/auth/session-guard'

export function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute cache
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {/* Renders nothing — registers the service worker once per session and
          bridges its NOTIFICATION_ACTIONED messages back into the store.
          Mounted here (not in AppShell) so it also covers the auth routes. */}
      <ServiceWorkerRegistrar />
      {/* Hydrates the auth store, keeps every tab's session in sync, and runs
          the inactivity clock. Mounted here rather than in AppShell so it also
          covers the auth routes — a signed-in user landing on /auth/login must
          hydrate too, or they render as signed out for a frame. */}
      <SessionGuard />
      {children}
    </QueryClientProvider>
  )
}