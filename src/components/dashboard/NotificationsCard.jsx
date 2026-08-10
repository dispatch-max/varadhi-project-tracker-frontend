'use client'

import { Bell, MoreHorizontal } from 'lucide-react'

const notifications = [
  {
    type: 'High',
    message: 'Deadline tomorrow for UI Kit',
    color: 'bg-red-100 text-red-600',
    dot: 'bg-red-500',
  },
  {
    type: 'Medium',
    message: 'New PR assigned for review',
    color: 'bg-yellow-100 text-yellow-600',
    dot: 'bg-yellow-500',
  },
  {
    type: 'Low',
    message: 'Team sync in 30 minutes',
    color: 'bg-green-100 text-green-600',
    dot: 'bg-green-500',
  },
]

export function NotificationsCard() {
  return (
    <div
      className="
        relative
        overflow-hidden
        h-[320px]
        rounded-3xl
        border
        border-white/30
        bg-gradient-to-br
        from-violet-100/80
        via-purple-50/60
        to-blue-100/70
        backdrop-blur-xl
        shadow-[0_8px_32px_rgba(139,92,246,0.15)]
        p-6
      "
    >
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500">
            <Bell className="h-4 w-4 text-white" />
          </div>

          <h3 className="text-lg font-semibold text-foreground">
            Notifications
          </h3>
        </div>

        <MoreHorizontal className="h-4 w-4 text-slate-400" />
      </div>

      {/* Notifications */}
      <div className="space-y-3">
        {notifications.map((item, index) => (
          <div
            key={index}
            className="
              flex items-center gap-3
              rounded-2xl
              bg-card/70
              backdrop-blur-md
              border border-white/40
              px-4 py-3
            "
          >
            <div
              className={`h-2.5 w-2.5 rounded-full ${item.dot}`}
            />

            <p className="text-sm text-foreground">
              <span className={`font-medium ${item.color}`}>
                {item.type}:
              </span>{' '}
              {item.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}