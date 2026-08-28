'use client'

import { useCallback, useState } from 'react'
import { GitMerge, Loader2, AlertTriangle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useHasMounted } from '@/hooks/use-has-mounted'
import { useAuthStore } from '@/store/auth.store'
import { useOutboxStore } from '@/store/outbox.store'
import { canMerge, resolveKeepMine, resolveUseServer, resolveMerge } from '@/lib/sync-engine'
import { OPERATIONS } from '@/lib/outbox'
import { cn } from '@/utils'

/**
 * Sync Conflicts panel (AC-15 requirement 7).
 *
 * Appears only when a replayed mutation lost a race with a server-side change.
 * Shows both values side by side and makes the user choose — nothing is
 * resolved automatically, because either side may be the one worth keeping.
 *
 * MERGE IS CONDITIONAL BY DESIGN. `status` is a single scalar: there is no
 * third value that is "both", so offering Merge there would be a fake choice
 * dressed up as a real one. It appears only for a multi-field edit where the
 * fields I changed and the fields they changed are genuinely disjoint.
 */

const FIELD_LABELS = {
  status: 'Status',
  title: 'Title',
  description: 'Description',
  priority: 'Priority',
  type: 'Type',
  dueDate: 'Due date',
  assigneeId: 'Assignee',
  estimatedHours: 'Estimated hours',
  actualHours: 'Actual hours',
  userStory: 'User story',
  acceptanceCriteria: 'Acceptance criteria',
}

function display(v) {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    return new Date(v).toLocaleString()
  }
  return String(v).replace(/_/g, ' ')
}

export function SyncConflicts({ className }) {
  const mounted = useHasMounted()
  const user = useAuthStore((s) => s.user)
  const conflicts = useOutboxStore((s) => s.conflicts)
  const refresh = useOutboxStore((s) => s.refresh)
  const [busy, setBusy] = useState(null)

  const act = useCallback(
    async (mutation, fn) => {
      setBusy(mutation.id)
      try {
        await fn(mutation)
        await refresh(user?.id)
      } finally {
        setBusy(null)
      }
    },
    [refresh, user?.id]
  )

  if (!mounted || conflicts.length === 0) return null

  return (
    <div
      className={cn(
        'rounded-xl border border-red-200 bg-red-50/60 p-4',
        className
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
        <h3 className="text-sm font-semibold text-slate-800">
          Sync conflicts ({conflicts.length})
        </h3>
      </div>
      <p className="mb-4 text-xs text-slate-600">
        These changes couldn&apos;t sync because the task was also changed
        elsewhere. Choose which version to keep — nothing is saved until you do.
      </p>

      <div className="space-y-4">
        {conflicts.map((m) => {
          const server = m.conflict?.serverTask
          const fields = m.conflict?.conflictFields?.length
            ? m.conflict.conflictFields
            : Object.keys(m.payload || {})
          const mergeable = canMerge(m)
          const isBusy = busy === m.id

          return (
            <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="mb-2 text-sm font-medium text-slate-800">
                {server?.title || 'Task'}
              </p>

              <div className="mb-3 overflow-x-auto">
                <table className="w-full min-w-[380px] text-xs">
                  <thead>
                    <tr className="text-left text-slate-400">
                      <th className="pb-1 font-medium">Field</th>
                      <th className="pb-1 font-medium">Your change</th>
                      <th className="pb-1 font-medium">On the server</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((f) => (
                      <tr key={f} className="border-t border-slate-100">
                        <td className="py-1.5 pr-3 text-slate-500">
                          {FIELD_LABELS[f] || f}
                        </td>
                        <td className="py-1.5 pr-3 font-medium text-violet-700">
                          {display(m.payload?.[f] ?? m.conflict?.attempted?.[f])}
                        </td>
                        <td className="py-1.5 font-medium text-slate-700">
                          {display(server?.[f])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="xs"
                  disabled={isBusy}
                  onClick={() => act(m, resolveKeepMine)}
                >
                  {isBusy && <Loader2 className="h-3 w-3 animate-spin" />}
                  Keep mine
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => act(m, resolveUseServer)}
                >
                  Use server
                </Button>

                {/* Only when the edits genuinely don't overlap — see canMerge. */}
                {mergeable && (
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => act(m, resolveMerge)}
                  >
                    <GitMerge className="h-3 w-3" />
                    Merge
                  </Button>
                )}

                {m.operation === OPERATIONS.TASK_STATUS && (
                  <span className="text-[11px] text-slate-400">
                    Status is a single value — it can&apos;t be merged.
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default SyncConflicts
