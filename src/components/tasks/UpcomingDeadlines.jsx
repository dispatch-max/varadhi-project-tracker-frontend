'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { tasksApi } from '@/lib/api/tasks.api'
import { formatDueLabel, priorityBadgeClass } from '@/lib/deadline-format'

function Shell({ children }) {
  return (
    <Card className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Upcoming Deadlines</h3>
        <Link href="/tasks" className="text-xs font-medium text-violet-600 hover:underline">
          View All
        </Link>
      </div>
      {children}
    </Card>
  )
}

export function UpcomingDeadlines() {
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await tasksApi.getUpcoming({ limit: 4, days: 30 })
        if (!cancelled) setTasks(data ?? [])
      } catch {
        if (!cancelled) setError('Failed to load deadlines.')
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
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-3 w-3/4 rounded bg-slate-100" />
              <div className="h-3 w-1/2 rounded bg-slate-100" />
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

  if (tasks.length === 0) {
    return (
      <Shell>
        <p className="py-4 text-sm text-muted-foreground">No upcoming deadlines.</p>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="space-y-3">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/tasks/${task.id}`}
            className="block rounded-lg border border-border p-3 transition hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {task.title}
              </p>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${priorityBadgeClass(
                  task.priority
                )}`}
              >
                {task.priority}
              </span>
            </div>

            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="truncate text-slate-400">{task.projectName ?? 'No project'}</span>
              <span className={task.isOverdue ? 'font-medium text-red-600' : 'text-muted-foreground'}>
                {formatDueLabel(task.daysLeft, task.dueDate)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </Shell>
  )
}
