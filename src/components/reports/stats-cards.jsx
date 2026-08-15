'use client'

import { useEffect, useState } from 'react'
import {
  FolderKanban,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react'
import { dashboardApi } from '@/lib/api/dashboard.api'

export function StatsCards() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Reuses the existing dashboard stats endpoint — same numbers, one
        // source of truth, already role-scoped server-side.
        const data = await dashboardApi.getStats()
        if (!cancelled) setStats(data)
      } catch {
        if (!cancelled) setError('Failed to load stats.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[104px] animate-pulse rounded-2xl border bg-card p-5 shadow-sm"
          >
            <div className="h-3 w-24 rounded bg-slate-100" />
            <div className="mt-3 h-7 w-12 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="mb-6 rounded-2xl border bg-card p-5 text-sm text-muted-foreground shadow-sm">
        {error ?? 'No data available.'}
      </div>
    )
  }

  const cards = [
    { title: 'Total Projects', value: stats.totalProjects, icon: FolderKanban },
    { title: 'Completed Tasks', value: stats.completedTasks, icon: CheckCircle },
    { title: 'In Progress', value: stats.inProgressTasks, icon: Clock },
    { title: 'Overdue', value: stats.overdueTasks, icon: AlertCircle },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      {cards.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.title}
            className="bg-card border rounded-2xl p-5 shadow-sm"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{item.title}</p>
                <h2 className="mt-2 text-3xl font-bold">{item.value}</h2>
              </div>
              <Icon className="h-10 w-10 text-violet-600" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
