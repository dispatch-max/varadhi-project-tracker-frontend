'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, Briefcase, Users } from 'lucide-react'
import { reportsApi } from '@/lib/api/reports.api'

const ROLE_META = {
  admin: {
    label: 'Admins',
    icon: ShieldCheck,
    color: 'bg-violet-600',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  manager: {
    label: 'Managers',
    icon: Briefcase,
    color: 'bg-blue-600',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
  },
  employee: {
    label: 'Employees',
    icon: Users,
    color: 'bg-emerald-600',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
}

function Shell({ children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-foreground">Team Productivity</h3>
        <p className="text-xs text-muted-foreground">Completion rate by role</p>
      </div>
      {children}
    </div>
  )
}

export function TeamProductivityCard() {
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await reportsApi.getRoleUtilization()
        // Completion rate is meaningless for a role with no assigned tasks.
        if (!cancelled) setRows((data ?? []).filter((r) => r.totalTasks > 0))
      } catch {
        if (!cancelled) setError('Failed to load team productivity.')
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
            <div key={i} className="flex animate-pulse items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-slate-100" />
              <div className="h-2 flex-1 rounded-full bg-slate-100" />
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
        <p className="py-4 text-sm text-muted-foreground">No assigned tasks yet.</p>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="space-y-4">
        {rows.map((row) => {
          const meta = ROLE_META[row.role] ?? ROLE_META.employee
          const Icon = meta.icon
          return (
            <div key={row.role} className="flex items-center gap-3">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.iconBg}`}>
                <Icon className={`h-4 w-4 ${meta.iconColor}`} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{meta.label}</span>
                  <span className="text-muted-foreground">
                    {row.completedTasks}/{row.totalTasks} · {row.completionRate}%
                  </span>
                </div>

                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${meta.color}`}
                    style={{ width: `${row.completionRate}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}
