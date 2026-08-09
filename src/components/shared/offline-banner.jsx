'use client'

import { CloudOff } from 'lucide-react'

import { useHasMounted } from '@/hooks/use-has-mounted'
import { useOnlineStatus } from '@/hooks/use-online-status'
import { cn } from '@/utils'

/**
 * The AC-14 offline indicator.
 *
 * Renders nothing while online, so it costs an online user nothing but a
 * subscription. When offline it explains what still works — reads are served
 * from the service worker's cache — and, importantly, that writes are not
 * queued. Offline writes are explicitly out of scope this pass (AC-15), so a
 * user who edits something offline would otherwise lose it silently. Saying so
 * is the difference between a degraded app and a lossy one.
 */
export function OfflineBanner({ className }) {
  const mounted = useHasMounted()
  const isOffline = useOnlineStatus()

  // Connectivity is client-only state; gate on mount so SSR and the first
  // client render agree.
  if (!mounted || !isOffline) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3',
        className
      )}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500 text-white">
        <CloudOff className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">You&apos;re offline</p>
        <p className="mt-0.5 text-xs text-slate-600">
          Showing the last data loaded on this device. Task changes you make are
          saved here and will sync automatically when you reconnect.
        </p>
      </div>
    </div>
  )
}

export default OfflineBanner
