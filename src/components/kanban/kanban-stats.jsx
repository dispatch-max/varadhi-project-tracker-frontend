'use client'

import { useEffect, useState } from 'react'
import {
  ClipboardList,
  CheckCircle2,
  Clock3,
  Eye,
} from 'lucide-react'
import { tasksApi } from '@/lib/api/tasks.api'

export function KanbanStats() {
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
        if (!cancelled) setError('Failed to load board stats.')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (isLoading) {
    return (
      <div className="grid w-full min-w-0 grid-cols-4 gap-2 lg:gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[92px] animate-pulse rounded-xl border border-border bg-card p-4"
          >
            <div className="mb-3 h-8 w-8 rounded-lg bg-slate-100" />
            <div className="h-5 w-16 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
        {error ?? 'No board data available.'}
      </div>
    )
  }

  const cards = [
    {
      title: 'Total Tasks',
      value: stats.total,
      change:
        stats.completedThisWeek > 0
          ? `+${stats.completedThisWeek} completed this week`
          : 'Across all projects',
      icon: ClipboardList,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      change: `${stats.inProgressPercent}% of total`,
      icon: Clock3,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Review',
      value: stats.inReview,
      change: `${stats.inReviewPercent}% of total`,
      icon: Eye,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Completed',
      value: stats.completed,
      change: `${stats.completedPercent}% of total`,
      icon: CheckCircle2,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
  ]

return (
  <div
    className="
      grid
      w-full
      min-w-0
      grid-cols-4
      gap-2
      lg:gap-3
    "
  >
    {cards.map((card) => {
      const Icon = card.icon

      return (
        <div
          key={card.title}
          className="
            min-w-0
            rounded-xl
            border
            border-border
            bg-card
            p-3
            lg:p-4
          "
        >
          <div
            className={`
              mb-2
              flex
              h-7
              w-7
              items-center
              justify-center
              rounded-lg
              lg:h-8
              lg:w-8
              ${card.iconBg}
            `}
          >
            <Icon
              className={`
                h-3.5
                w-3.5
                lg:h-4
                lg:w-4
                ${card.iconColor}
              `}
            />
          </div>

          <h3
            className="
              truncate
              text-xl
              font-bold
              text-foreground
              lg:text-2xl
            "
          >
            {card.value}
          </h3>

          <p
            className="
              truncate
              text-xs
              text-muted-foreground
              lg:text-sm
            "
          >
            {card.title}
          </p>

          <p
            className="
              mt-0.5
              truncate
              text-[10px]
              text-slate-400
              lg:text-xs
            "
          >
            {card.change}
          </p>
        </div>
      )
    })}
  </div>
)
}
