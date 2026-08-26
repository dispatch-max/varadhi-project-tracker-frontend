'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

import { tasksApi } from '@/lib/api/tasks.api'

function Shell({ children }) {
  return (
    <Card className="h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-[30px] items-center justify-between px-3">
        <h3 className="text-[11px] font-semibold text-slate-800">
          Tasks Overview
        </h3>

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
        if (!cancelled) {
          setError('Failed to load task stats.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  if (isLoading) {
    return (
      <Shell>
        <div className="animate-pulse px-3 pt-1">
          <div className="h-2.5 w-20 rounded bg-slate-100" />
          <div className="mt-3 h-5 w-full rounded-md bg-slate-100" />
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="flex h-[105px] items-center justify-center">
          <p className="text-[9px] text-slate-500">
            {error}
          </p>
        </div>
      </Shell>
    )
  }

  if (!stats || stats.total === 0) {
    return (
      <Shell>
        <div className="flex h-[105px] items-center justify-center">
          <p className="text-[9px] text-slate-400">
            No tasks yet.
          </p>
        </div>
      </Shell>
    )
  }

  const progress = stats.completedPercent ?? 0

  const breakdown = [
    { label: 'To Do', value: stats.todo ?? 0 },
    { label: 'In Progress', value: stats.inProgress ?? 0 },
    { label: 'Completed', value: stats.completed ?? 0 },
  ]

  return (
    <Shell>
      <div className="px-3 pb-2 pt-1">

        <p className="text-[9px] font-medium text-slate-700">
          Total tasks {stats.total}
        </p>



        <div className="mt-2.5">
          <div className="relative h-[18px] overflow-hidden rounded-md bg-slate-200">
            <div
              className="
                flex h-full items-center
                rounded-md
                bg-gradient-to-r
                from-violet-600 to-cyan-400
                px-2
              "
              style={{
                width: `${Math.max(progress, 10)}%`,
              }}
            >
              <span className="text-[8px] font-semibold text-white">
                {progress}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {breakdown.map((item) => (
            <div key={item.label}>
              <p className="text-[8px] text-slate-500">
                {item.label}
              </p>

              <p className="mt-1 text-[16px] font-medium leading-none text-slate-800">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}