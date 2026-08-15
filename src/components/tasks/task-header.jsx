'use client'

import { useEffect, useState } from 'react'
import { tasksApi } from '@/lib/api/tasks.api'

// Replaces a stub that rendered the literal text "Task Header". Shows the
// real open/overdue counts so the heading carries actual information.
export function TaskHeader() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await tasksApi.getStats()
        if (!cancelled) setStats(data)
      } catch {
        // Non-critical: the heading still renders without the counts.
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const open = stats ? stats.total - stats.completed : null

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Tasks</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {stats
            ? `${open} open · ${stats.completed} completed${
                stats.overdue > 0 ? ` · ${stats.overdue} overdue` : ''
              }`
            : 'Track and manage work across your projects.'}
        </p>
      </div>
    </div>
  )
}
