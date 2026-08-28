'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { MoreHorizontal } from 'lucide-react'
import { tasksApi } from '@/lib/api/tasks.api'
import {
  formatDueLabel,
  priorityBadgeClass,
  priorityLabel,
} from '@/lib/deadline-format'

function Shell({ children }) {
  return (
    <Card className="h-[360px] rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">
          Upcoming Deadlines
        </h3>
        <MoreHorizontal className="h-4 w-4 text-slate-400" />
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
        const data = await tasksApi.getUpcoming({ limit: 5, days: 30 })
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
        <div className="divide-y divide-slate-100">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="h-3 flex-1 rounded bg-slate-100" />
              <div className="h-5 w-20 rounded-full bg-slate-100" />
            </div>
          ))}
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="flex h-[280px] items-center justify-center px-5">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </Shell>
    )
  }

  if (tasks.length === 0) {
    return (
      <Shell>
        <div className="flex h-[280px] flex-col items-center justify-center gap-1 px-5 text-center">
          <p className="text-sm text-muted-foreground">No upcoming deadlines.</p>
          <p className="text-xs text-slate-400">
            Tasks with a due date in the next 30 days appear here.
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="divide-y divide-slate-100 overflow-y-auto">
        {tasks.map((task) => (
          <Link
            key={task.id}
            href={`/tasks/${task.id}`}
            className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-slate-50"
          >
            <div
              className={`w-28 shrink-0 text-sm ${
                task.isOverdue ? 'font-medium text-red-600' : 'text-muted-foreground'
              }`}
            >
              {formatDueLabel(task.daysLeft, task.dueDate)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {task.title}
              </p>
              {task.projectName && (
                <p className="truncate text-xs text-slate-400">{task.projectName}</p>
              )}
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${priorityBadgeClass(
                task.priority
              )}`}
            >
              {priorityLabel(task.priority)}
            </span>
          </Link>
        ))}
      </div>
    </Shell>
  )
}
