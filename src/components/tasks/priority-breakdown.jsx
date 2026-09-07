'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { tasksApi } from '@/lib/api/tasks.api'

// Presentation per priority level. `critical` is folded into the High tile
// because the card only has room for three columns and critical work is the
// most urgent slice of "high priority" from a triage point of view.
const TILES = [
  {
    key: 'high',
    label: 'High',
    includes: ['high', 'critical'],
    wrapper: 'border-red-100 bg-red-50',
    labelText: 'text-red-600',
    dot: 'bg-red-500',
    pctText: 'text-red-500',
    href: '/tasks?priority=high',
  },
  {
    key: 'medium',
    label: 'Medium',
    includes: ['medium'],
    wrapper: 'border-yellow-100 bg-yellow-50',
    labelText: 'text-yellow-700',
    dot: 'bg-yellow-500',
    pctText: 'text-yellow-600',
    href: '/tasks?priority=medium',
  },
  {
    key: 'low',
    label: 'Low',
    includes: ['low'],
    wrapper: 'border-green-100 bg-green-50',
    labelText: 'text-green-700',
    dot: 'bg-green-500',
    pctText: 'text-green-600',
    href: '/tasks?priority=low',
  },
]

function Shell({ children }) {
  return (
    <Card className="h-[160px] rounded-2xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Priority Breakdown</h3>
        <Link href="/tasks" className="text-xs font-medium text-violet-600 hover:underline">
          View Details
        </Link>
      </div>
      {children}
    </Card>
  )
}

export function PriorityBreakdown() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const result = await tasksApi.getPriorityBreakdown()
        if (!cancelled) setData(result)
      } catch {
        if (!cancelled) setError('Failed to load priority breakdown.')
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
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[74px] animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <p className="pt-6 text-sm text-muted-foreground">{error}</p>
      </Shell>
    )
  }

  const byPriority = Object.fromEntries(
    (data?.priorities ?? []).map((p) => [p.priority, p])
  )
  const total = data?.total ?? 0

  if (total === 0) {
    return (
      <Shell>
        <p className="pt-6 text-sm text-muted-foreground">No tasks yet.</p>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="grid grid-cols-3 gap-3">
        {TILES.map((tile) => {
          const count = tile.includes.reduce(
            (sum, level) => sum + (byPriority[level]?.count ?? 0),
            0
          )
          const percent = total > 0 ? Math.round((count / total) * 100) : 0

          return (
            <Link
              key={tile.key}
              href={tile.href}
              className={`rounded-xl border p-3 transition hover:brightness-95 ${tile.wrapper}`}
            >
              <div className="flex items-center gap-1">
                <p className={`text-xs ${tile.labelText}`}>{tile.label}</p>
                <span className={`h-2 w-2 rounded-full ${tile.dot}`} />
              </div>

              <div className="mt-2 flex items-end justify-between">
                <h4 className="text-2xl font-bold text-foreground">{count}</h4>
                <p className={`text-xs font-medium ${tile.pctText}`}>{percent}%</p>
              </div>
            </Link>
          )
        })}
      </div>
    </Shell>
  )
}
