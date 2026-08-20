'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { MoreHorizontal } from 'lucide-react'
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts'
import { dashboardApi } from '@/lib/api/dashboard.api'

// Maps the server's computed health class to its presentation.
const HEALTH_STYLES = {
  on_track: { label: 'On Track', color: 'bg-green-500', text: 'text-green-600' },
  at_risk: { label: 'At Risk', color: 'bg-amber-500', text: 'text-amber-600' },
  delayed: { label: 'Delayed', color: 'bg-red-500', text: 'text-red-600' },
}

function Shell({ children }) {
  return (
    <Card className="min-h-[360px] rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-6 pt-5">
        <h3 className="text-sm font-semibold text-foreground">
          Project Health Overview
        </h3>
        <MoreHorizontal className="h-4 w-4 text-slate-400 cursor-pointer" />
      </div>
      {children}
    </Card>
  )
}

export function ProjectHealth() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const result = await dashboardApi.getProjectHealth()
        if (!cancelled) setData(result)
      } catch {
        if (!cancelled) setError('Failed to load project health.')
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
        <div className="flex flex-1 flex-col items-center justify-center gap-4 animate-pulse">
          <div className="h-28 w-28 rounded-full bg-slate-100" />
          <div className="h-3 w-32 rounded bg-slate-100" />
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center px-6">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </Shell>
    )
  }

  const projects = data?.projects ?? []

  if (projects.length === 0) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center px-6">
          <p className="text-sm text-muted-foreground">No projects yet.</p>
        </div>
      </Shell>
    )
  }

  const overall = data.overallPercent
  const chartData = [{ value: overall, fill: '#7C3AED' }]
  // The gauge is the headline; the list below stays readable at four entries.
  const visible = projects.slice(0, 4)

  return (
    <Shell>
      <div className="flex justify-center py-2">
        <RadialBarChart
          width={140}
          height={140}
          data={chartData}
          innerRadius="68%"
          outerRadius="88%"
          startAngle={90}
          endAngle={-270}
          barSize={12}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />

          <RadialBar dataKey="value" cornerRadius={20} background={{ fill: '#ECEEF3' }} />

          <text
            x="50%"
            y="47%"
            textAnchor="middle"
            className="fill-slate-500 text-[11px]"
          >
            Overall Health
          </text>

          <text
            x="50%"
            y="61%"
            textAnchor="middle"
            className="fill-slate-900 text-lg md:text-xl xl:text-2xl font-bold"
          >
            {overall}%
          </text>
        </RadialBarChart>
      </div>

      <div className="mt-auto px-4 pb-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {visible.map((project) => {
          const style = HEALTH_STYLES[project.health] ?? HEALTH_STYLES.on_track
          return (
            <div key={project.id} className="contents">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`h-2.5 w-2.5 rounded-full ${style.color}`} />
                <span className="truncate text-muted-foreground text-sm">
                  {project.name}
                </span>
              </div>

              <div className="flex items-center justify-end gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${style.color}`} />
                <span className={`${style.text} whitespace-nowrap`}>
                  {style.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}
