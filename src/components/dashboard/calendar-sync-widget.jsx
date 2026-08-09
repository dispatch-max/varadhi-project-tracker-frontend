'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CalendarSync,
  CircleCheck,
  CircleDashed,
  ChevronRight,
  TriangleAlert,
} from 'lucide-react'

import { calendarApi } from '@/lib/api/calendar.api'
import { formatDate, formatRelativeTime } from '@/utils'

/**
 * Dashboard Calendar Sync widget.
 *
 * Styled with the raw-div card convention the sibling dashboard components use
 * (stats-cards, recent-activity, project-progress) rather than the shadcn Card
 * used on /calendar — a widget that looked different from the two cards beside
 * it would read as bolted on, which is the opposite of the intent.
 *
 * Shows sync state honestly: a per-event tick distinguishes "mirrored to your
 * calendar" from "queued for the next sweep", so a user can tell at a glance
 * whether their calendar is actually current.
 */

const PRIORITY_BAR = {
  critical: 'bg-red-400',
  high: 'bg-orange-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-300',
}

const MAX_ROWS = 5

export function CalendarSyncWidget() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(false)
    try {
      setData(await calendarApi.getUpcomingEvents({ limit: MAX_ROWS, days: 14 }))
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  const events = data?.events || []
  const connected = Boolean(data?.connected)

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <CalendarSync className="w-4 h-4 text-slate-400" />
            Calendar Sync
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {connected
              ? data?.lastSyncedAt
                ? `Last synced ${formatRelativeTime(data.lastSyncedAt)}`
                : 'Connected — first sync pending'
              : 'Not connected'}
          </p>
        </div>

        <Link
          href="/calendar"
          className="text-xs font-medium text-violet-600 hover:text-violet-700 flex items-center gap-0.5"
        >
          {connected ? 'Manage' : 'Connect'}
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
          <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        </div>
      ) : error ? (
        <p role="status" className="text-sm text-red-600">
          Couldn&apos;t load calendar sync.{' '}
          <button type="button" onClick={load} className="underline underline-offset-2">
            Retry
          </button>
        </p>
      ) : !connected ? (
        <div className="text-center py-6">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50">
            <CalendarSync className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-sm text-slate-600">No calendar connected</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Sync your deadlines to Google or Outlook so they show up where you
            plan your day.
          </p>
          <Link
            href="/calendar"
            className="mt-3 inline-block rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
          >
            Connect a calendar
          </Link>
        </div>
      ) : events.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Nothing due in the next two weeks.
        </p>
      ) : (
        <ul className="space-y-2">
          {events.slice(0, MAX_ROWS).map((event) => (
            <li key={event.sourceId}>
              <Link
                href={event.link}
                className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5 transition-colors hover:bg-slate-50"
              >
                <span
                  className={`h-8 w-1 shrink-0 rounded-full ${
                    PRIORITY_BAR[event.priority] || PRIORITY_BAR.low
                  }`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {event.title}
                  </span>
                  <span className="block truncate text-xs text-slate-500">
                    {formatDate(event.dueDate, 'EEE, MMM dd')}
                    {event.projectName ? ` · ${event.projectName}` : ''}
                  </span>
                </span>
                <span
                  className="shrink-0"
                  title={event.synced ? `Synced to ${event.provider}` : 'Queued for next sync'}
                >
                  {event.synced ? (
                    <CircleCheck className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <CircleDashed className="h-4 w-4 text-slate-300" />
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {connected && data?.providers?.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
          {events.some((e) => !e.synced) ? (
            <>
              <TriangleAlert className="h-3.5 w-3.5 text-amber-500" />
              Some items are waiting for the next sync (runs every 5 minutes).
            </>
          ) : (
            <>
              <CircleCheck className="h-3.5 w-3.5 text-emerald-600" />
              Everything is up to date on {data.providers.join(' and ')}.
            </>
          )}
        </p>
      )}
    </div>
  )
}

export default CalendarSyncWidget
