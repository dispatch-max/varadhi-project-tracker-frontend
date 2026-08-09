'use client'

import { useEffect } from 'react'

import { useConnectivityStore } from '@/store/connectivity.store'

/**
 * Keeps the connectivity store in sync with the browser's own online/offline
 * events, and returns the resulting state.
 *
 * The store — not this hook — is the source of truth, because the second
 * connectivity signal arrives from the axios interceptor, which has no React
 * context to write into. See connectivity.store.js for why one signal isn't
 * enough.
 *
 * Safe to call from more than one component: the listeners are per-instance but
 * the writes are idempotent no-ops when the value hasn't changed.
 */
export function useOnlineStatus() {
  const isOffline = useConnectivityStore((s) => s.isOffline)
  const setOffline = useConnectivityStore((s) => s.setOffline)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const goOffline = () => setOffline(true)
    const goOnline = () => setOffline(false)

    // Reconcile once on mount. The store starts optimistic for SSR's sake, so
    // a page loaded while already offline needs correcting here. Reading
    // navigator.onLine in an effect (rather than a lazy initialiser) is
    // deliberate — it must not affect the first render, or the SSR'd markup
    // and the hydrated tree disagree.
    if (navigator.onLine === false) setOffline(true)

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)

    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [setOffline])

  return isOffline
}

export default useOnlineStatus
