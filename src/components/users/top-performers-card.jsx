'use client'

import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { usersApi } from '@/lib/api/users.api'
import { getInitials, getAvatarColor, cn } from '@/utils'

function Shell({ children }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="mb-5 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-amber-500" />
        <h3 className="text-lg font-semibold text-foreground">Top Performers</h3>
      </div>
      {children}
    </div>
  )
}

export function TopPerformersCard() {
  const [performers, setPerformers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await usersApi.getStats()
        if (!cancelled) setPerformers(data?.topPerformers ?? [])
      } catch {
        if (!cancelled) setError('Failed to load top performers.')
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

  if (performers.length === 0) {
    return (
      <Shell>
        <p className="py-4 text-sm text-muted-foreground">
          No completed tasks yet.
        </p>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="space-y-4">
        {performers.map((person, index) => (
          <div key={person.id} className="flex items-center gap-3">
            <span className="w-4 shrink-0 text-xs font-semibold text-slate-400">
              {index + 1}
            </span>

            <div
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white',
                getAvatarColor(person.name || '?')
              )}
            >
              {getInitials(person.name || '?')}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {person.name}
              </p>
              <p className="truncate text-xs capitalize text-muted-foreground">
                {person.role}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-foreground">
                {person.completedTasks}
              </p>
              <p className="text-xs text-muted-foreground">{person.score}%</p>
            </div>
          </div>
        ))}
      </div>
    </Shell>
  )
}
