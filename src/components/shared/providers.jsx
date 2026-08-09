'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

import { ServiceWorkerRegistrar } from '@/components/shared/service-worker-registrar'

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
      {children}
    </QueryClientProvider>
  )
}