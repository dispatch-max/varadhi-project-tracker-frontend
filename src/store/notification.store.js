import { create } from 'zustand'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  // Set notifications and the authoritative unread count from the backend.
  // The list is usually just the most recent page, so unread count can't be
  // safely re-derived by filtering it — the backend already knows the real
  // global total. Falls back to filtering only if no count was passed.
  setNotifications: (notifications, unreadCount) =>
    set({
      notifications,
      unreadCount:
        typeof unreadCount === 'number'
          ? unreadCount
          : notifications.filter((n) => !n.isRead).length,
    }),

  setUnreadCount: (unreadCount) => set({ unreadCount }),

  // Mark single notification as read
  markAsRead: (id) => {
    const { notifications, unreadCount } = get()
    const target = notifications.find((n) => n.id === id)
    if (!target || target.isRead) return
    set({
      notifications: notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, unreadCount - 1),
    })
  },

  // Mark all as read
  markAllAsRead: () => {
    const notifications = get().notifications.map((n) => ({
      ...n,
      isRead: true,
    }))
    set({ notifications, unreadCount: 0 })
  },

  // Remove a dismissed notification and keep the unread badge honest.
  // `wasUnread` is a fallback for callers that keep their own list (the
  // /notifications page) where the row may not exist in this store.
  removeNotification: (id, wasUnread = false) => {
    const { notifications, unreadCount } = get()
    const inList = notifications.find((n) => n.id === id)
    const shouldDecrement = inList ? !inList.isRead : wasUnread
    set({
      notifications: notifications.filter((n) => n.id !== id),
      unreadCount: shouldDecrement ? Math.max(0, unreadCount - 1) : unreadCount,
    })
  },

  // Record that an inline action was taken on a notification (Module 2).
  // Acting also reads the notification server-side, so the badge is decremented
  // here to match — same bookkeeping as markAsRead, kept in one place so the
  // bell and the /notifications page can't drift apart.
  //
  // `actionedAt` is optional: the optimistic caller doesn't have the server
  // timestamp yet and passes nothing, which stamps "now" so the row can render
  // its actioned state immediately. The next poll replaces it with the real
  // server value.
  //
  // IDEMPOTENT BY CONSTRUCTION — two callers can fire for a single tap (the
  // in-app button and sw.js's NOTIFICATION_ACTIONED bridge), and the bell polls
  // every 30s on top of that. Every field below is an assignment rather than a
  // delta, except `unreadCount`; that decrement is guarded by re-reading
  // `target.isRead`, which the first call already set to true, so the badge
  // cannot be double-decremented. The `|| n.actionedAt` term likewise stops a
  // later bare call re-stamping an existing timestamp to "now". The poll itself
  // never routes through here — setNotifications replaces the list and takes
  // the server's unreadCount verbatim — so it cannot compound either.
  // Covered by scripts/notification-store.test.mjs.
  applyActionResult: (id, action, actionedAt) => {
    const { notifications, unreadCount } = get()
    const target = notifications.find((n) => n.id === id)
    if (!target) return
    set({
      notifications: notifications.map((n) =>
        n.id === id
          ? {
              ...n,
              actionTaken: action,
              actionedAt: actionedAt || n.actionedAt || new Date().toISOString(),
              isRead: true,
            }
          : n
      ),
      unreadCount: target.isRead ? unreadCount : Math.max(0, unreadCount - 1),
    })
  },

  // Add a new notification (for real-time later)
  addNotification: (notification) => {
    const notifications = [notification, ...get().notifications]
    set((state) => ({
      notifications,
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
    }))
  },
}))