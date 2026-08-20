'use client'

import { useEffect, useState } from 'react'
import { formatRelativeTime, formatExactTime } from '@/utils'
import { useHasMounted } from '@/hooks/use-has-mounted'

const REFRESH_MS = 30000

/**
 * Shared "time ago" display — the one place every relative timestamp in the
 * app (dashboard activity, notification bell, notifications page) should
 * render through, so they can't drift out of sync with each other again.
 * Self-refreshes so "2 minutes ago" doesn't go stale on a long-open tab, and
 * exposes the exact timestamp via a hover title.
 */
export function RelativeTime({ date, className }) {
  const mounted = useHasMounted()
  const [, forceTick] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => forceTick((n) => n + 1), REFRESH_MS)
    return () => clearInterval(interval)
  }, [])

  // Relative time depends on "now", which differs between server render and
  // client mount — render nothing until mounted to avoid a hydration mismatch
  // (same pattern as topbar.jsx / sidebar.jsx for other client-only state).
  if (!mounted) return null

  return (
    <span className={className} title={formatExactTime(date)}>
      {formatRelativeTime(date)}
    </span>
  )
}
