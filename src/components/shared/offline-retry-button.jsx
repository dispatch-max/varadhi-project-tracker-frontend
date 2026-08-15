'use client'

import { useCallback } from 'react'

/**
 * "Try again" for the offline fallback page.
 *
 * The service worker serves /offline in response to a failed navigation, but
 * the address bar still shows the URL the user asked for. So a reload retries
 * that exact request — a hardcoded link to /dashboard would silently discard
 * where they were going.
 *
 * Rendered as a real <a href> pointing at the current path, with onClick
 * upgrading it to location.reload(). That keeps it functional before hydration
 * and gives the browser a sensible target on middle-click, while avoiding a
 * Next client-side navigation (which would be served over the same dead
 * network and fail without ever hitting the SW).
 */
export function OfflineRetryButton({ className }) {
  const retry = useCallback((e) => {
    e.preventDefault()
    window.location.reload()
  }, [])

  return (
    <a
      // "." resolves to the current URL in every browser, so the no-JS
      // fallback retries the requested path rather than jumping elsewhere.
      href="."
      onClick={retry}
      className={
        className ||
        'mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-violet-600 px-4 text-sm font-medium text-white transition-colors hover:bg-violet-700'
      }
    >
      Try again
    </a>
  )
}

export default OfflineRetryButton
