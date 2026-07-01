'use client'

import { useState, useEffect } from 'react'

import { dashboardApi } from '@/lib/api/dashboard.api'

function SummaryCard({ label, value, sub, color, loading }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 px-5 py-4">
      {loading ? (
        <div className="h-8 w-12 bg-slate-100 rounded animate-pulse" />
      ) : (
        <p className={`text-2xl font-semibold ${color}`}>{value}</p>
      )}
      <p className="text-sm font-medium text-slate-700 mt-0.5">{label}</p>
      <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
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