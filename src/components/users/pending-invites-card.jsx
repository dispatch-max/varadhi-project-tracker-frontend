'use client'

import { useEffect, useState } from 'react'
import { Mail } from 'lucide-react'
import { usersApi } from '@/lib/api/users.api'
import { formatRelativeTime } from '@/utils'

function Shell({ children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-5 flex items-center gap-2">
        <Mail className="h-4 w-4 text-amber-600" />
        <h3 className="text-lg font-semibold text-foreground">Pending Invites</h3>
      </div>
      {children}
    </div>
  )
}

export function PendingInvitesCard() {
  const [invites, setInvites] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Invited users are just users with status='invited' — the existing
        // list endpoint already supports that filter.
        const data = await usersApi.getAll({ status: 'invited' })
        if (!cancelled) setInvites(data ?? [])
      } catch {
        if (!cancelled) setError('Failed to load pending invites.')
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
          {[0, 1].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
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

  if (invites.length === 0) {
    return (
      <Shell>
        <p className="py-4 text-sm text-muted-foreground">No pending invites.</p>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="space-y-3">
        {invites.map((invite) => (
          <div
            key={invite.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {invite.name || invite.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">{invite.email}</p>
            </div>

            <span className="shrink-0 text-xs text-slate-400">
              {formatRelativeTime(invite.created_at ?? invite.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </Shell>
  )
}
