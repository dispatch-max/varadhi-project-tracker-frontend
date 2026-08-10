'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { CalendarSync, MoreHorizontal } from 'lucide-react'
import { calendarApi } from '@/lib/api/calendar.api'

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

// The seven days starting today, so the strip always centres on the present
// rather than a hardcoded month.
function buildWeek(eventDates) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    return {
      key: d.toISOString().slice(0, 10),
      label: WEEKDAY[d.getDay()],
      date: String(d.getDate()),
      isToday: i === 0,
      hasEvent: eventDates.has(d.toISOString().slice(0, 10)),
    }
  })
}

function Shell({ children }) {
  return (
    <Card className="min-h-[320px] rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5">
        <h3 className="text-sm font-semibold text-foreground">Calendar Sync</h3>
        <MoreHorizontal className="h-4 w-4 cursor-pointer text-slate-400" />
      </div>
      {children}
    </Card>
  )
}

export function CalendarCard() {
  const [state, setState] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await calendarApi.getUpcomingEvents({ limit: 4, days: 14 })
        if (!cancelled) setState(data)
      } catch {
        if (!cancelled) setError('Failed to load calendar.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (isLoading) {
    return (
      <Shell>
        <div className="flex-1 animate-pulse space-y-4 px-6 pt-6">
          <div className="grid grid-cols-7 gap-3">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-100" />
            ))}
          </div>
          <div className="h-3 w-32 rounded bg-slate-100" />
          <div className="h-3 w-40 rounded bg-slate-100" />
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center px-6">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </Shell>
    )
  }

  const events = state?.events ?? []
  const connected = state?.connected ?? false

  // No provider linked yet — point at the page that can fix that rather than
  // rendering an empty grid with no explanation.
  if (!connected) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-50">
            <CalendarSync className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No calendar connected</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect Google or Outlook to see your meetings here.
            </p>
          </div>
          <Link
            href="/calendar"
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-violet-700"
          >
            Connect a calendar
          </Link>
        </div>
      </Shell>
    )
  }

  const eventDates = new Set(
    events
      .map((e) => (e.startsAt ? new Date(e.startsAt).toISOString().slice(0, 10) : null))
      .filter(Boolean)
  )
  const days = buildWeek(eventDates)

  return (
    <Shell>
      <div className="px-6 pt-6">
        <div className="grid grid-cols-7 gap-3">
          {days.map((item) => (
            <div key={item.key} className="flex flex-col items-center">
              <span className="mb-2 text-xs text-slate-400">{item.label}</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                  item.isToday
                    ? 'bg-violet-600 font-semibold text-white'
                    : item.hasEvent
                      ? 'bg-violet-50 font-medium text-violet-700'
                      : 'text-muted-foreground'
                }`}
              >
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex-1 divide-y divide-slate-100 px-6 pb-4">
        {events.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No events in the next 14 days.
          </p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="flex items-center gap-3 py-2.5">
              <span className="w-16 shrink-0 text-xs text-muted-foreground">
                {event.startsAt
                  ? new Date(event.startsAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                    })
                  : '—'}
              </span>
              <span className="truncate text-sm text-foreground">{event.title}</span>
            </div>
          ))
        )}
      </div>
    </Shell>
  )
}
