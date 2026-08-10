'use client'

import { useState, useEffect } from 'react'

import { dashboardApi } from '@/lib/api/dashboard.api'

import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  AlertCircle
} from 'lucide-react'

function SummaryCard({
  label,
  value,
  sub,
  color,
  loading,
  icon: Icon
}) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {label}
          </p>

          {loading ? (
            <div className="h-8 w-16 bg-slate-100 rounded animate-pulse mt-2" />
          ) : (
            <h3 className={`text-3xl font-bold mt-1 ${color}`}>
              {value}
            </h3>
          )}

          <p className="text-xs text-green-600 font-medium mt-2">
            {sub}
          </p>
        </div>

        <div className="w-12 h-12 rounded-xl bg-background flex items-center justify-center">
          {Icon && (
  <Icon className={`w-6 h-6 ${color}`} />
)}
        </div>
      </div>

      <div className="mt-4 h-10 flex items-end gap-1">
        <div className="h-3 bg-violet-300 rounded flex-1"></div>
        <div className="h-4 bg-violet-400 rounded flex-1"></div>
        <div className="h-6 bg-violet-500 rounded flex-1"></div>
        <div className="h-5 bg-violet-400 rounded flex-1"></div>
        <div className="h-8 bg-violet-600 rounded flex-1"></div>
      </div>
    </div>
  )
}

export function SummaryCards() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const data = await dashboardApi.getStats()
        if (active) setStats(data ?? null)
      } catch (err) {
        console.error('REPORTS STATS ERROR =>', err)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const s = stats || {}
  const total = s.totalTasks ?? 0
  const completed = s.completedTasks ?? 0
  const members = s.teamMembers ?? 0

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
  const avgPerMember = members > 0 ? (total / members).toFixed(1) : '0'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <SummaryCard
        label="Tasks Completed"
        value={completed}
        sub={`of ${total} total`}
        color="text-green-600"
        loading={loading}
      />
      <SummaryCard
        label="Completion Rate"
        value={`${completionRate}%`}
        sub="Across all tasks"
        color="text-violet-600"
        loading={loading}
      />
      <SummaryCard
        label="Avg per Member"
        value={avgPerMember}
        sub="Tasks per active member"
        color="text-blue-600"
        loading={loading}
      />
      <SummaryCard
        label="Overdue Tasks"
        value={s.overdueTasks ?? 0}
        sub="Need attention"
        color="text-red-500"
        loading={loading}
      />
    </div>
  )
}