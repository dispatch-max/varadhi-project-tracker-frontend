'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, MoreHorizontal } from 'lucide-react'
import { notificationsApi } from '@/lib/api/notifications.api'

// Backend priorities are low | normal | high | urgent (see NOTIFICATION_TYPES).
const PRIORITY_STYLES = {
  urgent: { label: 'Urgent', text: 'text-red-700', dot: 'bg-red-600' },
  high: { label: 'High', text: 'text-red-600', dot: 'bg-red-500' },
  normal: { label: 'Normal', text: 'text-yellow-600', dot: 'bg-yellow-500' },
  low: { label: 'Low', text: 'text-green-600', dot: 'bg-green-500' },
}

function Shell({ children }) {
  return (
    <div
      className="
        relative overflow-hidden h-[320px] rounded-3xl border border-white/30
        bg-gradient-to-br from-violet-100/80 via-purple-50/60 to-blue-100/70
        backdrop-blur-xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6
      "
    >
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500">
            <Bell className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Notifications</h3>
        </div>
        <MoreHorizontal className="h-4 w-4 text-slate-400" />
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
        // Unread only — a dashboard card showing already-read items is noise.
        // The backend expects `unreadOnly=true` (notifications.controller.js:54).
        const { notifications } = await notificationsApi.list({ limit: 3, unreadOnly: true })
        if (!cancelled) setItems(notifications ?? [])
      } catch {
        if (!cancelled) setError('Failed to load notifications.')
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
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[52px] animate-pulse rounded-2xl border border-white/40 bg-card/70"
            />
          ))}
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">{error}</p>
      </Shell>
    )
  }

  if (items.length === 0) {
    return (
      <Shell>
        <div className="flex h-[180px] flex-col items-center justify-center gap-1 text-center">
          <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
          <p className="text-xs text-slate-400">No unread notifications.</p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="space-y-3">
        {items.map((item) => {
          const style = PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.normal
          const body = (
            <div className="flex items-center gap-3 rounded-2xl border border-white/40 bg-card/70 px-4 py-3 backdrop-blur-md">
              <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
              <p className="line-clamp-2 text-sm text-foreground">
                <span className={`font-medium ${style.text}`}>{style.label}:</span>{' '}
                {item.title || item.message}
              </p>
            </div>
          )

          return item.linkTo ? (
            <Link key={item.id} href={item.linkTo} className="block transition hover:opacity-80">
              {body}
            </Link>
          ) : (
            <div key={item.id}>{body}</div>
          )
        })}
      </div>
    </Shell>
  )
}
