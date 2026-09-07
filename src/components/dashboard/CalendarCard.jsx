'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { CalendarSync } from 'lucide-react'
import { calendarApi } from '@/lib/api/calendar.api'

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

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
    <Card
      className="
        flex h-full min-h-0 flex-col
        overflow-hidden
        rounded-2xl
        border border-slate-200
        bg-white
        shadow-sm
      "
    >
      {/* FIXED HEADER */}
      <div className="flex h-[30px] shrink-0 items-center px-3">
        <div className="flex items-center gap-1.5">
          <CalendarSync className="h-3.5 w-3.5 text-violet-500" />

          <h3 className="text-[10px] font-semibold text-slate-700">
            Calendar Sync
          </h3>
        </div>
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
        const data = await calendarApi.getUpcomingEvents({
          limit: 4,
          days: 14,
        })

        if (!cancelled) {
          setState(data)
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load calendar.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  if (isLoading) {
    return (
      <Shell>
        <div className="min-h-0 flex-1 px-3 pt-2">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="h-7 animate-pulse rounded-md bg-slate-100"
              />
            ))}
          </div>
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="flex min-h-0 flex-1 items-center justify-center px-3">
          <p className="text-[8px] text-slate-500">
            {error}
          </p>
        </div>
      </Shell>
    )
  }

  const events = state?.events ?? []
  const connected = state?.connected ?? false

  if (!connected) {
    return (
      <Shell>
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1.5 px-3 text-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-50">
            <CalendarSync className="h-3.5 w-3.5 text-violet-600" />
          </div>

          <p className="text-[9px] font-medium text-slate-700">
            No calendar connected
          </p>

          <Link
            href="/calendar"
            className="rounded-md bg-violet-600 px-2 py-1 text-[8px] font-medium text-white"
          >
            Connect
          </Link>
        </div>
      </Shell>
    )
  }

  const eventDates = new Set(
    events
      .map((event) =>
        event.startsAt
          ? new Date(event.startsAt).toISOString().slice(0, 10)
          : null
      )
      .filter(Boolean)
  )

  const days = buildWeek(eventDates)

  return (
    <Shell>
      {/* FIXED WEEK */}
      <div className="shrink-0 px-3 pb-1 pt-1.5">
        <div className="grid grid-cols-7 gap-1">
          {days.map((item) => (
            <div
              key={item.key}
              className="flex flex-col items-center"
            >
              <span className="text-[7px] leading-none text-slate-400">
                {item.label}
              </span>

              <span
                className={`
                  mt-1 flex h-5 w-5
                  items-center justify-center
                  rounded-md text-[8px]
                  ${
                    item.isToday
                      ? 'bg-violet-600 font-semibold text-white'
                      : item.hasEvent
                        ? 'bg-violet-50 font-medium text-violet-700'
                        : 'text-slate-500'
                  }
                `}
              >
                {item.date}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ONLY EVENTS SCROLL */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="divide-y divide-slate-100 px-3">
          {events.length === 0 ? (
            <p className="py-3 text-center text-[8px] text-slate-400">
              No events in the next 14 days.
            </p>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                className="flex items-center gap-2 py-1.5"
              >
                <span className="w-11 shrink-0 text-[7px] text-slate-400">
                  {event.startsAt
                    ? new Date(event.startsAt).toLocaleDateString(
                        undefined,
                        {
                          day: 'numeric',
                          month: 'short',
                        }
                      )
                    : '—'}
                </span>

                <span className="min-w-0 flex-1 truncate text-[8px] font-medium text-slate-600">
                  {event.title}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </Shell>
  )
}