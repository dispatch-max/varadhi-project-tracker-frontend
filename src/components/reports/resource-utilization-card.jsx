'use client'

import { useEffect, useState } from 'react'
import { reportsApi } from '@/lib/api/reports.api'

const ROLE_LABELS = {
  admin: 'Admins',
  manager: 'Managers',
  employee: 'Employees',
}

function Shell({ children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Resource Utilization</h3>
        <p className="text-xs text-muted-foreground">
          Open work per active member, by role
        </p>
      </div>
      {children}
    </div>
  )
}

export function ResourceUtilizationCard() {
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await reportsApi.getRoleUtilization()
        // Roles with no members contribute nothing readable to the chart.
        if (!cancelled) setRows((data ?? []).filter((r) => r.memberCount > 0))
      } catch {
        if (!cancelled) setError('Failed to load resource utilization.')
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
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-3 w-24 rounded bg-slate-100" />
              <div className="h-2 w-full rounded-full bg-slate-100" />
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

  if (rows.length === 0) {
    return (
      <Shell>
        <p className="py-4 text-sm text-muted-foreground">No active members yet.</p>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.role}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-foreground">
                {ROLE_LABELS[row.role] ?? row.role}
                <span className="ml-1 text-xs text-slate-400">
                  ({row.memberCount})
                </span>
              </span>
              <span className="text-muted-foreground">
                {row.openPerMember} open/member
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{ width: `${row.utilizationPercent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Shell>
  )
}
