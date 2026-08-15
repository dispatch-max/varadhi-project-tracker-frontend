'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { reportsApi } from '@/lib/api/reports.api'

function Shell({ children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-violet-600" />
        <div>
          <h3 className="font-semibold text-foreground">Business Intelligence</h3>
          <p className="text-xs text-muted-foreground">Last 30 days vs prior 30</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export function BusinessIntelligenceCard() {
  const [metrics, setMetrics] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await reportsApi.getBusinessIntelligence()
        if (!cancelled) setMetrics(data?.metrics ?? [])
      } catch {
        if (!cancelled) setError('Failed to load metrics.')
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

  return (
    <Shell>
      <div className="space-y-3">
        {metrics.map((metric) => {
          // `positive: null` means the direction carries no judgement (more
          // incoming work is neither good nor bad), so it renders neutral.
          const tone =
            metric.positive === null
              ? 'text-muted-foreground'
              : metric.positive
                ? 'text-emerald-600'
                : 'text-red-600'
          const Icon = metric.direction === 'down' ? TrendingDown : TrendingUp

          return (
            <div
              key={metric.key}
              className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{metric.title}</p>
                <p className="truncate text-xs text-muted-foreground">{metric.detail}</p>
              </div>

              <div className={`flex shrink-0 items-center gap-1 ${tone}`}>
                <Icon className="h-4 w-4" />
                <span className="text-sm font-semibold">{metric.value}</span>
              </div>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}
