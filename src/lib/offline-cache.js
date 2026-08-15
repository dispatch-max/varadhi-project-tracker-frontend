/**
 * Page-side control over the service worker's caches.
 *
 * Deliberately does NOT go through the service worker. A postMessage round-trip
 * would fail exactly when it matters most: if the SW was never registered, was
 * killed, or is a stale version mid-update, the message goes nowhere and the
 * caches survive. The Cache Storage API is available directly on the window and
 * shares one origin-scoped store with the SW, so deleting from here is both
 * simpler and strictly more reliable.
 *
 * Every function resolves rather than throws. Cache clearing runs on the
 * logout, 401 and login paths — none of which may be blocked by a storage
 * failure, private-mode restriction, or a browser with no Cache API at all.
 */

// Must stay in sync with the CACHE_PREFIX in public/sw.js. Anything matching
// this prefix is ours to delete, whatever version suffix it carries — that is
// what lets a clear also sweep up caches left by an older SW_VERSION.
const CACHE_PREFIX = 'varadhi-'

/**
 * Delete every Varadhi cache for this origin.
 *
 * Called on logout, on a 401, and on successful login. The login-side call is
 * the real cross-user-leak guarantee: if the browser is killed mid-session
 * without a clean logout, that is the first moment we can be certain a
 * different user may be about to read the previous user's cached API responses.
 *
 * @returns {Promise<number>} how many caches were removed (0 on any failure)
 */
export async function clearOfflineCaches() {
  if (typeof window === 'undefined' || !('caches' in window)) return 0

  try {
    const keys = await caches.keys()
    const ours = keys.filter((key) => key.startsWith(CACHE_PREFIX))
    // Settle all deletions even if one rejects — a single failure must not
    // leave the remaining caches in place.
    const results = await Promise.allSettled(ours.map((key) => caches.delete(key)))
    return results.filter((r) => r.status === 'fulfilled' && r.value).length
  } catch {
    // No Cache API, private mode, or a storage error. The app is fully
    // functional without offline support; never surface this.
    return 0
  }
}

/**
 * Names of the current Varadhi caches. Used by the QA harness and useful in the
 * console when checking what a version bump actually left behind.
 */
export async function listOfflineCaches() {
  if (typeof window === 'undefined' || !('caches' in window)) return []
  try {
    return (await caches.keys()).filter((key) => key.startsWith(CACHE_PREFIX))
  } catch {
    return []
  }
}
