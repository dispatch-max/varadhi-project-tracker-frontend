'use client'

import { useEffect, useState } from 'react'
import {
  CheckSquare,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Eye,
} from 'lucide-react'

import { tasksApi } from '@/lib/api/tasks.api'

export function TaskStats() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadStats() {
      try {
        const data = await tasksApi.getStats()

        if (!cancelled) {
          setStats(data)
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load task stats.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadStats()

    return () => {
      cancelled = true
    }
  }, [])

  /* =====================================================
     SAME GRID FOR LOADING + REAL CARDS
     5 CARDS ALWAYS IN ONE ROW
  ====================================================== */

  const gridStyle = {
    gridTemplateColumns:
      'repeat(5, minmax(0, 1fr))',
  }

  /* =====================================================
     LOADING
  ====================================================== */

  if (isLoading) {
    return (
      <div
        className="
          grid
          w-full
          min-w-0
          gap-2
        "
        style={gridStyle}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="
              h-[76px]
              min-h-0
              min-w-0
              overflow-hidden
              rounded-xl
              border
              border-border
              bg-card
              px-3
              py-2
            "
          >
            <div className="flex h-full animate-pulse items-center gap-3">

              {/* ICON */}
              <div
                className="
                  h-8
                  w-8
                  shrink-0
                  rounded-lg
                  bg-slate-100
                "
              />

              {/* TEXT */}
              <div className="min-w-0 flex-1">
                <div className="mb-1 h-5 w-10 rounded bg-slate-100" />
                <div className="mb-1 h-2.5 w-16 rounded bg-slate-100" />
                <div className="h-2 w-20 max-w-full rounded bg-slate-100" />
              </div>

            </div>
          </div>
        ))}
      </div>
    )
  }

  /* =====================================================
     ERROR
  ====================================================== */

  if (error || !stats) {
    return (
      <div
        className="
          rounded-xl
          border
          border-border
          bg-card
          px-4
          py-3
          text-xs
          text-muted-foreground
        "
      >
        {error ?? 'No task statistics available.'}
      </div>
    )
  }

  /* =====================================================
     CARDS
  ====================================================== */

  const cards = [
    {
      title: 'Total Tasks',
      value: stats.total ?? 0,
      subtitle:
        stats.completedThisWeek > 0
          ? `+${stats.completedThisWeek} this week`
          : 'Across all projects',
      icon: CheckSquare,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },

    {
      title: 'Completed',
      value: stats.completed ?? 0,
      subtitle: `${stats.completedPercent ?? 0}% of total`,
      icon: CheckCircle2,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },

    {
      title: 'In Progress',
      value: stats.inProgress ?? 0,
      subtitle: `${stats.inProgressPercent ?? 0}% of total`,
      icon: Clock3,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },

    {
      title: 'Overdue',
      value: stats.overdue ?? 0,
      subtitle: `${stats.overduePercent ?? 0}% of total`,
      icon: AlertTriangle,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
    },

    {
      title: 'In Review',
      value: stats.inReview ?? 0,
      subtitle: `${stats.inReviewPercent ?? 0}% of total`,
      icon: Eye,
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  ]

  /* =====================================================
     REAL CONTENT
  ====================================================== */

  return (
    <div
      className="
        grid
        w-full
        min-w-0
        gap-2
      "
      style={gridStyle}
    >
      {cards.map((card) => {
        const Icon = card.icon

        return (
          <div
            key={card.title}
            className="
              h-[76px]
              min-h-0
              min-w-0
              overflow-hidden
              rounded-xl
              border
              border-border
              bg-card
              px-3
              py-2
              shadow-sm
            "
          >
            <div
              className="
                flex
                h-full
                min-w-0
                items-center
                gap-3
              "
            >
              {/* =========================================
                  ICON
              ========================================== */}

              <div
                className={`
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  ${card.iconBg}
                `}
              >
                <Icon
                  className={`
                    h-4
                    w-4
                    ${card.iconColor}
                  `}
                />
              </div>

              {/* =========================================
                  CONTENT
              ========================================== */}

              <div
                className="
                  min-w-0
                  flex-1
                  overflow-hidden
                "
              >
                {/* VALUE */}

                <h3
                  className="
                    truncate
                    text-lg
                    font-bold
                    leading-5
                    text-foreground
                  "
                >
                  {card.value}
                </h3>

                {/* TITLE */}

                <p
                  className="
                    truncate
                    text-[11px]
                    font-medium
                    leading-4
                    text-muted-foreground
                  "
                >
                  {card.title}
                </p>

                {/* SUBTITLE */}

                <p
                  className="
                    truncate
                    text-[9px]
                    leading-3
                    text-slate-400
                  "
                  title={card.subtitle}
                >
                  {card.subtitle}
                </p>
              </div>

            </div>
          </div>
        )
      })}
    </div>
  )
}