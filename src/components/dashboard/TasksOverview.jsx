'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { MoreHorizontal } from 'lucide-react'
import { tasksApi } from '@/lib/api/tasks.api'

function Shell({ children }) {
  return (
    <Card className="h-[360px] rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5">
        <h3 className="text-sm font-semibold text-foreground">Tasks Overview</h3>
        <MoreHorizontal className="h-4 w-4 text-slate-400" />
      </div>
      {children}
    </Card>
  )
}

export function TasksOverview() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await tasksApi.getStats()
        if (!cancelled) setStats(data)
      } catch {
        if (!cancelled) setError('Failed to load task stats.')
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
        <div className="flex-1 px-6 pt-6 animate-pulse space-y-4">
          <div className="h-3 w-20 rounded bg-slate-100" />
          <div className="h-10 w-24 rounded bg-slate-100" />
          <div className="h-6 w-full rounded-full bg-slate-100" />
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center px-6">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </Shell>
    )
  }

  if (!stats || stats.total === 0) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center px-6">
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
        </div>
      </Shell>
    )
  }

  // Completion share drives the bar; the server already rounds it.
  const progress = stats.completedPercent
  const breakdown = [
    { label: 'To Do', value: stats.todo },
    { label: 'In Progress', value: stats.inProgress },
    { label: 'Completed', value: stats.completed },
  ]

  return (
    <Shell>
      <div className="px-6 mt-4">
        <p className="text-sm text-muted-foreground">Total Tasks</p>

        <div className="flex flex-wrap items-end gap-3 mt-2">
          <h2 className="text-5xl font-bold">{stats.total}</h2>
          {stats.completedThisWeek > 0 && (
            <span className="text-sm text-green-600">
              +{stats.completedThisWeek} completed this week
            </span>
          )}
        </div>
      </div>

      <div className="px-6 mt-6">
        <div className="h-6 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="flex h-full items-center justify-end rounded-full bg-gradient-to-r from-violet-600 to-cyan-400 pr-3"
            style={{ width: `${Math.max(progress, 8)}%` }}
          >
            <span className="text-xs font-medium text-white">{progress}%</span>
          </div>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-3 border-t border-slate-100">
        {breakdown.map((item) => (
          <div key={item.label} className="py-5 text-center">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <h3 className="mt-1 text-2xl font-bold">{item.value}</h3>
          </div>
        ))}
      </div>
    </Shell>
  )
}
