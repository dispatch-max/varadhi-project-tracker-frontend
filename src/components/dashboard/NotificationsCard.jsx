'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, MoreHorizontal } from 'lucide-react'
import { notificationsApi } from '@/lib/api/notifications.api'

const PRIORITY_STYLES = {
  urgent: {
    label: 'Urgent',
    text: 'text-red-700',
    dot: 'bg-red-600',
  },
  high: {
    label: 'High',
    text: 'text-red-600',
    dot: 'bg-red-500',
  },
  normal: {
    label: 'Normal',
    text: 'text-yellow-600',
    dot: 'bg-yellow-500',
  },
  low: {
    label: 'Low',
    text: 'text-green-600',
    dot: 'bg-green-500',
  },
}

function Shell({ children }) {
  return (
    <div
      className="
        flex h-full min-h-0 flex-col
        overflow-hidden rounded-2xl
        border border-violet-100
        bg-gradient-to-br
        from-violet-100/80
        via-purple-50/60
        to-blue-100/70
        shadow-sm
      "
    >
      <div className="flex h-[30px] shrink-0 items-center justify-between border-b border-white/50 px-3">

        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-500">
            <Bell className="h-3 w-3 text-white" />
          </div>

          <h3 className="text-[11px] font-semibold text-slate-800">
            Notifications
          </h3>
        </div>

        <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
      </div>

      {children}
    </div>
  )
}

export function NotificationsCard() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const { notifications } =
          await notificationsApi.list({
            limit: 3,
            unreadOnly: true,
          })

        if (!cancelled) {
          setItems(notifications ?? [])
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load notifications.')
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
        <div className="flex flex-1 items-center justify-center">
          <p className="text-[9px] text-slate-400">
            Loading...
          </p>
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center">
          <p className="text-[9px] text-slate-500">
            {error}
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
        <div className="space-y-1.5">
          {items.map((item) => {
            const style =
              PRIORITY_STYLES[item.priority] ??
              PRIORITY_STYLES.normal

            const body = (
              <div className="flex items-start gap-2 rounded-lg border border-white/50 bg-white/70 px-2 py-1.5">
                <span
                  className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`}
                />

                <p className="line-clamp-2 text-[8px] leading-[1.2] text-slate-700">
                  <span
                    className={`font-semibold ${style.text}`}
                  >
                    {style.label}:
                  </span>{' '}
                  {item.title || item.message}
                </p>
              </div>
            )

            return item.linkTo ? (
              <Link key={item.id} href={item.linkTo}>
                {body}
              </Link>
            ) : (
              <div key={item.id}>
                {body}
              </div>
            )
          })}
        </div>
      </div>
    </Shell>
  )
}