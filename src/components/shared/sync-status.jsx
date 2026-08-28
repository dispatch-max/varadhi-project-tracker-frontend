'use client'

import { CloudUpload, Loader2, AlertTriangle } from 'lucide-react'

import { useHasMounted } from '@/hooks/use-has-mounted'
import { useSyncEngine } from '@/hooks/use-sync-engine'
import { useOutboxStore } from '@/store/outbox.store'
import { useConnectivityStore } from '@/store/connectivity.store'
import { MUTATION_STATUS } from '@/lib/outbox'
import { cn } from '@/utils'

/**
 * Pending-sync indicator (AC-15 requirement 3).
 *
 * Renders nothing when the queue is empty, so an online user with nothing
 * outstanding sees no change at all. Mounting it also starts the sync engine —
 * one mount point for both the indicator and the replay loop keeps them from
 * disagreeing about whether a sync is in flight.
 */
export function SyncStatus({ className }) {
  const mounted = useHasMounted()
  const { syncNow } = useSyncEngine()
  const pending = useOutboxStore((s) => s.pending)
  const isSyncing = useOutboxStore((s) => s.isSyncing)
  const isOffline = useConnectivityStore((s) => s.isOffline)

  if (!mounted || pending.length === 0) return null

  const failed = pending.filter((m) => m.status === MUTATION_STATUS.FAILED)
  const waiting = pending.length

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-center gap-3 rounded-xl border px-4 py-3',
        failed.length
          ? 'border-amber-200 bg-amber-50'
          : 'border-violet-200 bg-violet-50',
        className
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white',
          failed.length ? 'bg-amber-500' : 'bg-violet-600'
        )}
      >
        {isSyncing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : failed.length ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <CloudUpload className="h-4 w-4" />
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">
          {isSyncing
            ? 'Syncing your changes…'
            : `${waiting} change${waiting === 1 ? '' : 's'} waiting to sync`}
        </p>
        <p className="mt-0.5 text-xs text-slate-600">
          {isOffline
            ? "Saved on this device. They'll sync automatically when you reconnect."
            : failed.length
              ? `${failed.length} couldn't be sent yet — retrying automatically.`
              : 'Sending now…'}
        </p>
      </div>

      {!isOffline && !isSyncing && (
        <button
          onClick={syncNow}
          className="shrink-0 text-xs font-medium text-violet-700 transition-colors hover:text-violet-900"
        >
          Retry now
        </button>
      )}
    </div>
  )
}

export default SyncStatus
