'use client'

import { useEffect, useState } from 'react'
import {
  CheckSquare,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Eye,
} from 'lucide-react'

import { StatsCard } from './stats-card'
import { tasksApi } from '@/lib/api/tasks.api'

export function TaskStats() {
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
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[104px] animate-pulse rounded-2xl border border-border bg-card p-4"
          >
            <div className="mb-3 h-8 w-8 rounded-lg bg-slate-100" />
            <div className="mb-2 h-6 w-12 rounded bg-slate-100" />
            <div className="h-3 w-20 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
        {error ?? 'No task data available.'}
      </div>
    )
  }

  const share = (pct) => `${pct}% of total`

  // "Blocked" is not a status in this schema (todo/in_progress/in_review/
  // completed), so the fifth card shows In Review — a real state — rather
  // than a fabricated one.
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
      <StatsCard
        title="Total Tasks"
        value={String(stats.total)}
        subtitle={
          stats.completedThisWeek > 0
            ? `+${stats.completedThisWeek} completed this week`
            : 'Across all projects'
        }
        icon={CheckSquare}
      />

      <StatsCard
        title="Completed"
        value={String(stats.completed)}
        subtitle={share(stats.completedPercent)}
        icon={CheckCircle2}
      />

      <StatsCard
        title="In Progress"
        value={String(stats.inProgress)}
        subtitle={share(stats.inProgressPercent)}
        icon={Clock3}
      />

      <StatsCard
        title="Overdue"
        value={String(stats.overdue)}
        subtitle={share(stats.overduePercent)}
        icon={AlertTriangle}
      />

      <StatsCard
        title="In Review"
        value={String(stats.inReview)}
        subtitle={share(stats.inReviewPercent)}
        icon={Eye}
      />
    </div>
  )
}
