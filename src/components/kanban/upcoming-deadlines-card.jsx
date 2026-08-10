'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar } from 'lucide-react'
import { tasksApi } from '@/lib/api/tasks.api'
import { formatDueLabel } from '@/lib/deadline-format'

function Shell({ children }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Upcoming Deadlines</h3>
        <Link href="/tasks" className="text-xs text-violet-600 hover:underline">
          View All
        </Link>
      </div>
      {children}
    </div>
  )
}

export function UpcomingDeadlinesCard() {
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
            <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
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
            className="flex items-center gap-3 rounded-lg p-2 transition hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50">
              <Calendar className="h-4 w-4 text-violet-600" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
              <p className="text-xs text-slate-400">
                {task.projectName ?? 'No project'}
              </p>
            </div>

            <span
              className={`shrink-0 text-xs ${
                task.isOverdue ? 'font-medium text-red-600' : 'text-muted-foreground'
              }`}
            >
              {formatDueLabel(task.daysLeft, task.dueDate)}
            </span>
          </Link>
        ))}
      </div>
    </Shell>
  )
}
