'use client'

import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { reportsApi } from '@/lib/api/reports.api'

function Shell({ children }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-foreground">Task Completion</h3>
        <p className="text-sm text-muted-foreground">Distribution by status</p>
      </div>
      {children}
    </div>
  )
}

export function TaskCompletionChart() {
  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Reuses the existing endpoint that already returns name/value/color
        // per status with a stable legend.
        const result = await reportsApi.getTaskStatus()
        if (!cancelled) setData(result ?? [])
      } catch {
        if (!cancelled) setError('Failed to load task completion.')
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
        <div className="mx-auto h-[180px] w-[180px] animate-pulse rounded-full bg-slate-100" />
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

  const total = data.reduce((sum, d) => sum + (d.value ?? 0), 0)

  if (total === 0) {
    return (
      <Shell>
        <p className="py-10 text-center text-sm text-muted-foreground">No tasks yet.</p>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="truncate text-muted-foreground">{entry.name}</span>
            <span className="ml-auto font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    </Shell>
  )
}
