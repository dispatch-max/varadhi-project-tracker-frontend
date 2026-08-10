'use client'

import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { usersApi } from '@/lib/api/users.api'
import { getInitials, getAvatarColor, formatRelativeTime, cn } from '@/utils'

function Shell({ children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-5 flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-violet-600" />
        <h3 className="text-lg font-semibold text-foreground">Recently Joined</h3>
      </div>
      {children}
    </div>
  )
}

export function RecentlyJoinedCard() {
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await usersApi.getStats()
        if (!cancelled) setMembers(data?.recentlyJoined ?? [])
      } catch {
        if (!cancelled) setError('Failed to load recent members.')
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
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex animate-pulse items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-100" />
              <div className="h-3 flex-1 rounded bg-slate-100" />
            </div>
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

  if (members.length === 0) {
    return (
      <Shell>
        <p className="py-4 text-sm text-muted-foreground">No members yet.</p>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="space-y-4">
        {members.map((member) => (
          <div key={member.id} className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
                getAvatarColor(member.name || '?')
              )}
            >
              {getInitials(member.name || '?')}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {member.name}
              </p>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {member.role}
              </p>
            </div>

            <span className="shrink-0 text-xs text-slate-400">
              {formatRelativeTime(member.createdAt)}
            </span>
          </div>
        ))}
      </div>
    </Shell>
  )
}
