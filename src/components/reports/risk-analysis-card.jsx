'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { reportsApi } from '@/lib/api/reports.api'

const LEVEL_META = {
  High: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700' },
  Medium: { icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' },
  Low: { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', badge: 'bg-emerald-100 text-emerald-700' },
}

function Shell({ children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Risk Analysis</h3>
        <p className="text-xs text-muted-foreground">Project risk indicators</p>
      </div>
      {children}
    </div>
  )
}

export function RiskAnalysisCard() {
  const [risks, setRisks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await reportsApi.getRiskAnalysis()
        if (!cancelled) setRisks(data?.risks ?? [])
      } catch {
        if (!cancelled) setError('Failed to load risk analysis.')
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
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
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
        {risks.map((risk) => {
          const meta = LEVEL_META[risk.level] ?? LEVEL_META.Low
          const Icon = meta.icon
          return (
            <div
              key={risk.key}
              className={`flex items-center gap-3 rounded-lg p-3 ${meta.bg}`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${meta.color}`} />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {risk.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">{risk.detail}</p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}
              >
                {risk.level}
              </span>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}
