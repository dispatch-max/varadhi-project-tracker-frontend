import { create } from 'zustand'

/**
 * Connectivity state, from two independent signals.
 *
 * `navigator.onLine` alone is not trustworthy: it reports whether the device
 * has *a* network interface up, not whether the API is reachable. It stays true
 * on a captive portal, on a wifi network with no upstream, and when the backend
 * itself is down — all cases where the user is, for our purposes, offline.
 *
 * So the store accepts a second signal: `api-client.js` reports failed requests
 * (`ERR_NETWORK`) here, and any successful response clears the flag. Whichever
 * signal fires first wins, and a successful request always beats a stale
 * offline guess — the banner disappears the moment real data arrives, even if
 * the browser's own event never fired.
 */
export const useConnectivityStore = create((set, get) => ({
  // Starts optimistic. Server-rendered HTML has no navigator, and flashing an
  // offline banner on first paint for a perfectly online user is worse than a
  // moment's delay before showing a real one.
  isOffline: false,

  // Set from the browser's online/offline events (use-online-status.js).
  setOffline: (isOffline) => {
    if (get().isOffline === isOffline) return
    set({ isOffline })
  },

  // Called by the axios interceptor when a request fails at the transport
  // layer. This is the captive-portal case navigator.onLine misses.
  reportNetworkError: () => {
    if (get().isOffline) return
    set({ isOffline: true })
  },

  // Called by the axios interceptor on any successful response. Proof of
  // reachability outranks every other signal.
  reportNetworkSuccess: () => {
    if (!get().isOffline) return
    set({ isOffline: false })
  },
}))
