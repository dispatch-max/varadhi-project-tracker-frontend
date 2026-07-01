import { create } from 'zustand'

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  // Set all notifications (called on page load)
  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),

  // Mark single notification as read
  markAsRead: (id) => {
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    )
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
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

  // Add a new notification (for real-time later)
  addNotification: (notification) => {
    const notifications = [notification, ...get().notifications]
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    })
  },
}))