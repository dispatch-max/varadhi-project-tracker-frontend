'use client'

import { Mail } from 'lucide-react'

export function PendingInvitesCard() {
  const invites = [
    {
      name: 'Rahul Patel',
      email: 'rahul@example.com',
      sent: '2 days ago',
    },
    {
      name: 'Sneha Sharma',
      email: 'sneha@example.com',
      sent: '1 day ago',
    },
    {
      name: 'Arjun Kumar',
      email: 'arjun@example.com',
      sent: '5 hours ago',
    },
  ]

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-amber-500" />

          <h3 className="text-sm font-semibold text-foreground">
            Pending Invites
          </h3>
        </div>

        <button className="text-xs font-medium text-violet-600 hover:text-violet-700">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {invites.map((invite) => (
          <div
            key={invite.email}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-foreground">
                {invite.name}
              </p>

              <p className="text-xs text-muted-foreground">
                {invite.email}
              </p>
            </div>

            <div className="text-right">
              <span className="inline-flex px-2 py-1 rounded-md bg-amber-100 text-amber-700 text-xs font-medium">
                Pending
              </span>

              <p className="text-xs text-slate-400 mt-1">
                {invite.sent}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}