'use client'

import { useState } from 'react'
import { Check, Loader2, X, AlertTriangle, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { RelativeTime } from '@/components/shared/relative-time'
import { useNotificationStore } from '@/store/notification.store'
import {
  notificationActionsApi,
  toActionError,
} from '@/lib/api/notification-actions.api'
import { cn } from '@/utils'

/**
 * Inline action buttons for an actionable notification (Module 2).
 *
 * Shared by the bell dropdown and the /notifications page so the two can't
 * drift apart. Renders nothing at all unless the row actually carries actions,
 * which keeps every pre-Module-2 notification looking exactly as it did.
 *
 * Flow mirrors the optimistic-then-reconcile pattern used elsewhere in this
 * codebase (notification-bell.jsx#handleDismiss): apply locally, call the API,
 * and on failure refetch from the server rather than guessing.
 */

const ACTION_STYLE = {
  approve: { icon: Check, variant: 'default', label: 'Approve' },
  reject: { icon: X, variant: 'outline', label: 'Reject' },
  accept: { icon: Check, variant: 'default', label: 'Accept' },
  snooze_1h: { icon: Clock, variant: 'outline', label: 'Snooze 1h' },
  snooze_3h: { icon: Clock, variant: 'outline', label: 'Snooze 3h' },
  snooze_tomorrow: { icon: Clock, variant: 'outline', label: 'Tomorrow' },
}

/**
 * The push notification can only carry two buttons, so it ships Accept +
 * Snooze 1h. In-app there's room for the full menu — these are offered
 * alongside whatever the notification itself specifies.
 */
const SNOOZE_MENU = [
  { action: 'snooze_1h', title: '1 hour' },
  { action: 'snooze_3h', title: '3 hours' },
  { action: 'snooze_tomorrow', title: 'Tomorrow' },
]

const isSnooze = (name) => typeof name === 'string' && name.startsWith('snooze')

/** Past-tense state shown once an action has been taken. */
const ACTIONED_LABEL = {
  approve: 'Approved',
  reject: 'Rejected',
  accept: 'Accepted',
  snooze: 'Snoozed',
  // Someone else handled it. These notifications fan out one row per reviewer,
  // so when any one of them acts the rest are marked 'resolved' server-side —
  // otherwise every other reviewer keeps live buttons for finished work.
  resolved: 'Handled',
}

const ACTIONED_STYLE = {
  approve: 'text-emerald-600',
  reject: 'text-amber-600',
  accept: 'text-violet-600',
  snooze: 'text-slate-500',
  resolved: 'text-slate-500',
}

export function NotificationActions({
  notification,
  size = 'sm',
  onResolved,
  className,
}) {
  const applyActionResult = useNotificationStore((s) => s.applyActionResult)
  const [pending, setPending] = useState(null)
  const [conflict, setConflict] = useState(null)

  const { actions, actionTaken, actionedAt } = notification

  // Already actioned — show the outcome, never the buttons.
  //
  // The backend records every snooze duration as plain 'snooze' (the duration
  // lives in the queue row), so collapse any snooze_* the optimistic path may
  // have set locally onto the same key.
  if (actionTaken) {
    const key = isSnooze(actionTaken) ? 'snooze' : actionTaken
    let label = ACTIONED_LABEL[key] || 'Done'

    // For a sibling row, say what actually happened and who did it — "Handled"
    // alone leaves the reviewer wondering whether it was approved or rejected.
    if (key === 'resolved') {
      const r = notification.actionResult
      const verb = ACTIONED_LABEL[r?.action]
      const who = r?.byUserName
      if (verb) label = who ? `${verb} by ${who}` : verb
    }

    return (
      <p
        className={cn(
          'flex items-center gap-1 text-xs font-medium',
          ACTIONED_STYLE[key] || 'text-slate-500',
          className
        )}
      >
        {key === 'snooze' ? (
          <Clock className="w-3 h-3 shrink-0" />
        ) : (
          <Check className="w-3 h-3 shrink-0" />
        )}
        <span>{label}</span>
        {actionedAt && (
          <RelativeTime date={actionedAt} className="font-normal text-slate-400" />
        )}
      </p>
    )
  }

  if (!Array.isArray(actions) || actions.length === 0) return null

  async function run(actionName, e) {
    // These buttons sit inside a row whose parent navigates on click.
    e.stopPropagation()
    e.preventDefault()
    if (pending) return

    setPending(actionName)
    setConflict(null)

    try {
      const result = await notificationActionsApi.perform(notification.id, actionName)

      // 'superseded' means the outcome was already true (someone else got there
      // first). Still a success — record it so the row stops offering buttons.
      //
      // Store 'snooze' rather than the specific duration, matching what the
      // server persists, so the optimistic render and the next poll agree.
      const stored = isSnooze(actionName) ? 'snooze' : actionName
      applyActionResult(notification.id, stored, result.actionedAt)
      onResolved?.({ ok: true, action: stored, result })
    } catch (err) {
      const details = toActionError(err)

      // A 409 is never a silent no-op: the row explains what happened and,
      // where the server told us, what the task's real state now is.
      setConflict(details.message)

      // The server is authoritative — let the caller reconcile so the row
      // repaints with whatever actually happened.
      onResolved?.({ ok: false, action: actionName, error: details })
    } finally {
      setPending(null)
    }
  }

  // Push can only carry two buttons, so an actionable notification arrives with
  // at most one snooze option. In-app there is room for the whole menu, so
  // expand any single snooze into 1h / 3h / Tomorrow.
  const rendered = actions.some((a) => isSnooze(a.action))
    ? [...actions.filter((a) => !isSnooze(a.action)), ...SNOOZE_MENU]
    : actions

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center gap-1.5 flex-wrap">
        {rendered.map((a) => {
          const style = ACTION_STYLE[a.action] || {
            icon: Check,
            variant: 'outline',
            label: a.title || a.action,
          }
          const Icon = style.icon
          const isPending = pending === a.action
          return (
            <Button
              key={a.action}
              size={size}
              variant={style.variant}
              disabled={!!pending}
              onClick={(e) => run(a.action, e)}
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Icon />
              )}
              {a.title || style.label}
            </Button>
          )
        })}
      </div>

      {conflict && (
        <p className="flex items-start gap-1 text-xs text-amber-700">
          <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
          <span>{conflict}</span>
        </p>
      )}
    </div>
  )
}

export default NotificationActions
