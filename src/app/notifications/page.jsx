'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { notificationsApi } from '@/lib/api/notifications.api'
import { useNotificationStore } from '@/store/notification.store'
import { RelativeTime } from '@/components/shared/relative-time'
import { NotificationActions } from '@/components/shared/notification-actions'
import { getNotificationTypeMeta } from '@/constants/notification-types'
import { cn } from '@/utils'

const PAGE_SIZE = 20

const PRIORITY_DOT = {
  urgent: 'bg-red-500',
  high: 'bg-amber-500',
  normal: 'bg-violet-500',
  low: 'bg-slate-300',
}

export default function NotificationsPage() {
  const router = useRouter()
  const {
    markAsRead: markReadInStore,
    markAllAsRead: markAllReadInStore,
    removeNotification: removeFromStore,
  } = useNotificationStore()

  const [items, setItems] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async (page, onlyUnread) => {
    setIsLoading(true)
    setError(false)
    try {
      const res = await notificationsApi.list({ page, limit: PAGE_SIZE, unreadOnly: onlyUnread })
      setItems(res.notifications)
      setPagination(res.pagination)
    } catch (err) {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // load only calls setState after its internal await; same traced-false-positive
    // as notification-bell.jsx's fetchNotifications (useCallback hides that from the linter).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(1, unreadOnly)
  }, [load, unreadOnly])

  function handleItemClick(notification) {
    if (!notification.isRead) {
      setItems((prev) =>
        prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
      )
      // Keep the topbar bell's badge/list in sync with actions taken from this page.
      markReadInStore(notification.id)
      notificationsApi.markAsRead(notification.id).catch(() => {})
    }
    if (notification.linkTo) router.push(notification.linkTo)
  }

  async function handleMarkAllAsRead() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })))
    markAllReadInStore()
    try {
      await notificationsApi.markAllAsRead()
    } catch (err) {
      load(pagination.page, unreadOnly)
    }
  }

  function handleDismiss(notification) {
    // Optimistic on this page's own list, plus the shared store so the
    // topbar badge stays correct. A failure reloads the current page.
    setItems((prev) => prev.filter((x) => x.id !== notification.id))
    setPagination((p) => ({ ...p, total: Math.max(0, (p.total || 1) - 1) }))
    removeFromStore(notification.id, !notification.isRead)
    notificationsApi
      .remove(notification.id)
      .catch(() => load(pagination.page, unreadOnly))
  }

  function goToPage(nextPage) {
    if (nextPage < 1 || nextPage > pagination.totalPages) return
    load(nextPage, unreadOnly)
  }

  // An inline action resolved. On success mirror it into this page's own list
  // (the shared store is already updated by NotificationActions); on failure
  // reload so the row shows whatever the server actually holds.
  function handleActionResolved(notification, outcome) {
    if (!outcome.ok) {
      load(pagination.page, unreadOnly)
      return
    }
    setItems((prev) =>
      prev.map((n) =>
        n.id === notification.id
          ? {
              ...n,
              actionTaken: outcome.action,
              actionedAt: outcome.result?.actionedAt || new Date().toISOString(),
              isRead: true,
            }
          : n
      )
    )
  }

  // Mirror action results that originated OUTSIDE this page into the local
  // list. This page keeps its own paginated `items` (the store holds only the
  // bell's short list), so without this it would show a stale row until manual
  // reload — and unlike the bell it does not poll.
  //
  // The case that matters is AC-9: tapping Approve on a push notification while
  // this page is open. sw.js posts NOTIFICATION_ACTIONED, the registrar calls
  // applyActionResult, and the store updates — but nothing reached this list.
  // Subscribing to the store closes that loop. Actions taken on this page are
  // already handled by handleActionResolved above; re-applying the same values
  // here is a harmless no-op because the fields are assignments, not deltas.
  // Derived during render rather than synced through an effect: `items` stays
  // the server's paginated truth, and the store is overlaid on top of it. That
  // avoids the extra render pass an effect would cost, and there is no state to
  // fall out of date because the merge re-runs whenever either input changes.
  const storeNotifications = useNotificationStore((s) => s.notifications)

  const rows = useMemo(() => {
    if (!storeNotifications.length) return items
    return items.map((n) => {
      const fromStore = storeNotifications.find((s) => s.id === n.id)
      if (!fromStore?.actionTaken || fromStore.actionTaken === n.actionTaken) return n
      return {
        ...n,
        actionTaken: fromStore.actionTaken,
        actionedAt: fromStore.actionedAt,
        isRead: true,
      }
    })
  }, [items, storeNotifications])

  const hasUnread = rows.some((n) => !n.isRead)

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Notifications</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Everything the tracker has sent you, in one place.
          </p>
        </div>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead}>
            <Check className="w-3.5 h-3.5" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setUnreadOnly(false)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
            !unreadOnly ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:bg-slate-100'
          )}
        >
          All
        </button>
        <button
          onClick={() => setUnreadOnly(true)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
            unreadOnly ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:bg-slate-100'
          )}
        >
          Unread
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-sm text-slate-400 text-center py-16">
            Couldn&apos;t load notifications. Try again shortly.
          </p>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <Bell className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-sm">
              {unreadOnly ? 'No unread notifications.' : 'No notifications yet.'}
            </p>
          </div>
        ) : (
          rows.map((n) => {
            const meta = getNotificationTypeMeta(n.type)
            const TypeIcon = meta.icon
            return (
              // Row is a div, not a button: the dismiss control is a real
              // button and nesting buttons is invalid HTML.
              <div
                key={n.id}
                className={cn(
                  'px-4 py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors',
                  !n.isRead && 'bg-violet-50/60'
                )}
              >
               <div className="flex items-start gap-3">
                <button
                  onClick={() => handleItemClick(n)}
                  className="flex-1 min-w-0 flex items-start gap-3 text-left"
                >
                  {/* Type indicator — replaces the old bare priority dot. */}
                  <span
                    title={meta.label}
                    className={cn(
                      'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                      meta.className
                    )}
                  >
                    <TypeIcon className="w-4 h-4" />
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'text-sm leading-relaxed',
                          n.isRead ? 'text-slate-600' : 'text-slate-800 font-medium'
                        )}
                      >
                        {n.title}
                      </span>
                      {/* Readable type name — the page has room for it, the
                          bell dropdown relies on the icon + tooltip instead. */}
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 shrink-0">
                        {meta.label}
                      </span>
                    </span>
                    {n.message && <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>}
                    <RelativeTime date={n.createdAt} className="block text-xs text-slate-300 mt-1" />
                  </span>
                </button>

                <span className="flex items-center gap-2 shrink-0 mt-1.5">
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
                    <X className="w-4 h-4" />
                  </button>
                </span>
               </div>

                {/* Inline actions live outside the row's <button> (no nested
                    buttons). Renders null when the row has no actions. */}
                <NotificationActions
                  notification={n}
                  size="sm"
                  className="mt-2.5 pl-12"
                  onResolved={(outcome) => handleActionResolved(n, outcome)}
                />
              </div>
            )
          })
        )}
      </div>

      {!isLoading && !error && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
