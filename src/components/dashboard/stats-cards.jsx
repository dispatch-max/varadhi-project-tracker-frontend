'use client'

import { useEffect, useState } from 'react'
import {
  FolderOpen,
  ListChecks,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { dashboardApi } from '@/lib/api/dashboard.api'

const STAT_CONFIG = [
  {
    label: 'Total Projects',
    key: 'totalProjects',
    icon: FolderOpen,
    trend: 'All projects',
  },
  {
    label: 'Active Projects',
    key: 'activeProjects',
    icon: FolderOpen,
    trend: 'Currently running',
  },
  {
    label: 'Total Tasks',
    key: 'totalTasks',
    icon: ListChecks,
    trend: 'Across all projects',
  },
  {
    label: 'Completed',
    key: 'completedTasks',
    icon: CheckCircle2,
    trend: 'Tasks finished',
  },
  {
    label: 'In Progress',
    key: 'inProgressTasks',
    icon: Clock,
    trend: 'Being worked on',
  },
  {
    label: 'Overdue',
    key: 'overdueTasks',
    icon: AlertTriangle,
    trend: 'Needs attention',
  },
]

function StatSkeleton() {
  return (
    <div
      className="
        h-full
        min-w-0
        overflow-hidden
        rounded-2xl
        border border-slate-200
        bg-white
        px-3
        py-2
        shadow-sm
        animate-pulse
      "
    >
      <div className="flex items-center justify-between gap-2">
        <div className="h-2 w-16 rounded bg-slate-100" />
        <div className="h-3.5 w-3.5 rounded bg-slate-100" />
      </div>

      <div className="mt-2 h-6 w-10 rounded bg-slate-100" />

      <div className="mt-1 h-2 w-20 rounded bg-slate-100" />
    </div>
  )
}

export function StatsCards() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await dashboardApi.getStats()

        setStats(data)
      } catch {
        setStats({
          totalProjects: 0,
          activeProjects: 0,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  /* =====================================================
     LOADING
  ====================================================== */

  if (isLoading) {
    return (
      <div
        className="
          grid
          h-full
          min-h-0
          min-w-0
          gap-2
        "
        style={{
          gridTemplateColumns:
            'repeat(6, minmax(0, 1fr))',
        }}
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <StatSkeleton key={i} />
        ))}
      </div>
    )
  }

  /* =====================================================
     STATS
  ====================================================== */

  return (
    <div
      className="
        grid
        h-full
        min-h-0
        min-w-0
        gap-2
      "
      style={{
        gridTemplateColumns:
          'repeat(6, minmax(0, 1fr))',
      }}
    >
      {STAT_CONFIG.map((stat) => {
        const Icon = stat.icon

        return (
          <div
            key={stat.key}
            className="
              h-full
              min-w-0
              overflow-hidden

              rounded-2xl

              border
              border-slate-200

              bg-white

              px-3
              py-2

              shadow-sm

              transition-shadow
              duration-200

              hover:shadow-md
            "
          >
            {/* HEADER */}
            <div
              className="
                flex
                min-w-0
                items-center
                justify-between
                gap-2
              "
            >
              <p
                className="
                  min-w-0
                  truncate

                  text-[10px]
                  font-semibold
                  leading-none
                  text-slate-700
                "
              >
                {stat.label}
              </p>

              <Icon
                className="
                  h-3.5
                  w-3.5
                  shrink-0
                  text-slate-400
                "
              />
            </div>

            {/* VALUE */}
            <p
              className="
                mt-1.5

                text-[24px]
                font-bold
                leading-none
                text-slate-900
              "
            >
              {stats?.[stat.key] ?? 0}
            </p>

            {/* DESCRIPTION */}
            <p
              className="
                mt-1
                truncate

                text-[9px]
                leading-none
                text-slate-500
              "
            >
              {stat.trend}
            </p>
          </div>
        )
      })}
    </div>
  )
}