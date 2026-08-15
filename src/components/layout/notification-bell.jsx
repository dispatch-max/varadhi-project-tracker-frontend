'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { notificationsApi } from '@/lib/api/notifications.api'
import { useNotificationStore } from '@/store/notification.store'
import { useHasMounted } from '@/hooks/use-has-mounted'
import { RelativeTime } from '@/components/shared/relative-time'
import { NotificationActions } from '@/components/shared/notification-actions'
import { getNotificationTypeMeta } from '@/constants/notification-types'
import { cn, truncate } from '@/utils'

const POLL_INTERVAL_MS = 30000
const PANEL_LIMIT = 10

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high: 'bg-amber-500',
  normal: 'bg-violet-500',
  low: 'bg-slate-300',
}

function NotificationSkeleton() {
  return (
    <div className="p-3 space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-2 animate-pulse">
          <div className="w-2 h-2 rounded-full bg-slate-100 mt-1.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="h-3 bg-slate-100 rounded w-full mb-1.5" />
            <div className="h-3 bg-slate-100 rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function NotificationBell() {
  const router = useRouter()
  const mounted = useHasMounted()
  const {
    notifications,
    unreadCount,
    setNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationStore()

  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  const hasFetchedOnce = useRef(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const { notifications: list, unreadCount: count } = await notificationsApi.list({
        limit: PANEL_LIMIT,
      })
      setNotifications(list, count)
      setError(false)
    } catch (err) {
      setError(true)
    } finally {
      hasFetchedOnce.current = true
      setIsLoading(false)
    }
  }, [setNotifications])

  // Fetch on mount, then poll so the badge stays live while the app is open —
  // this runs for as long as the topbar is mounted, i.e. the whole session.
  useEffect(() => {
    // fetchNotifications only calls setState after its internal `await`, so
    // this is safe — the lint rule just can't trace that through useCallback.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications()
    const interval = setInterval(fetchNotifications, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  function handleOpenChange(nextOpen) {
    setOpen(nextOpen)
    if (nextOpen) {
      // Only flash the skeleton if we've genuinely never loaded before —
      // otherwise refresh quietly behind the already-visible list.
      setIsLoading(!hasFetchedOnce.current)
      fetchNotifications()
    }
  }

  function handleItemClick(notification) {
    if (!notification.isRead) {
      markAsRead(notification.id)
      notificationsApi.markAsRead(notification.id).catch(() => {})
    }
    setOpen(false)
    if (notification.linkTo) router.push(notification.linkTo)
  }

  function handleViewAll() {
    setOpen(false)
    router.push('/notifications')
  }

  function handleDismiss(notification) {
    // Optimistic — the row disappears instantly. The store keeps the unread
    // badge correct; a failure reconciles from the server.
    removeNotification(notification.id, !notification.isRead)
    notificationsApi.remove(notification.id).catch(() => fetchNotifications())
  }

  async function handleMarkAllAsRead(e) {
    e.stopPropagation()
    if (unreadCount === 0) return
    markAllAsRead()
    try {
      await notificationsApi.markAllAsRead()
    } catch (err) {
      // Local state already flipped optimistically; reconcile with the server.
      fetchNotifications()
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors">
          <Bell className="w-4 h-4" />
          {mounted && unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100">
          <p className="text-sm font-semibold text-slate-800">Notifications</p>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Mark all as read
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <NotificationSkeleton />
          ) : error ? (
            <p className="text-xs text-slate-400 text-center py-8 px-4">
              Couldn&apos;t load notifications. Try again shortly.
            </p>
          ) : notifications.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">
              No notifications yet.
            </p>
          ) : (
            notifications.map((n) => {
              const meta = getNotificationTypeMeta(n.type)
              const TypeIcon = meta.icon
              return (
                // Row is a div, not a button: the dismiss control is a real
                // button and nesting buttons is invalid HTML.
                <div
                  key={n.id}
                  className={cn(
                    'px-3 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors',
                    !n.isRead && 'bg-violet-50'
                  )}
                >
                 <div className="flex items-start gap-2.5">
                  <button
                    onClick={() => handleItemClick(n)}
                    className="flex-1 min-w-0 flex items-start gap-2.5 text-left"
                  >
                    {/* Type indicator — replaces the old bare priority dot.
                        title= gives the type name on hover / to screen readers. */}
                    <span
                      title={meta.label}
                      className={cn(
                        'w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5',
                        meta.className
                      )}
                    >
                      <TypeIcon className="w-3.5 h-3.5" />
                    </span>

                    <span className="flex-1 min-w-0">
                      <p
                        className={cn(
                          'text-xs leading-relaxed',
                          n.isRead ? 'text-slate-600' : 'text-slate-800 font-medium'
                        )}
                      >
                        {n.title}
                      </p>
                      {n.message && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {truncate(n.message, 80)}
                        </p>
                      )}
                      <RelativeTime
                        date={n.createdAt}
                        className="block text-xs text-slate-300 mt-0.5"
                      />
                    </span>
                  </button>

                  <span className="flex items-center gap-1.5 shrink-0 mt-1.5">
                    {/* Priority signal preserved — unread only, as before. */}
                    {!n.isRead && (
                      <span
                        title={`${n.priority || 'normal'} priority`}
                        className={cn(
                          'w-2 h-2 rounded-full',
                          PRIORITY_DOT[n.priority] || 'bg-violet-500'
                        )}
                      />
                    )}
                    <button
                      onClick={() => handleDismiss(n)}
                      aria-label="Dismiss notification"
                      title="Dismiss"
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                 </div>

                  {/* Inline actions sit outside the row's <button> — nesting
                      buttons is invalid HTML. Renders nothing when the row
                      carries no actions, so ordinary notifications are
                      completely unchanged. */}
                  <NotificationActions
                    notification={n}
                    size="xs"
                    className="mt-2 pl-[38px]"
                    onResolved={(r) => { if (!r.ok) fetchNotifications() }}
                  />
                </div>
              )
            })
          )}
        </div>

        <button
          onClick={handleViewAll}
          className="w-full text-center px-3 py-2 text-xs font-medium text-violet-600 hover:text-violet-700 hover:bg-slate-50 border-t border-slate-100 transition-colors"
        >
          View all notifications
        </button>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
