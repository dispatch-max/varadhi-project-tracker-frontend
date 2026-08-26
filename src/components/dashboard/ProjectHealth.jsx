'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'

import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts'
import { dashboardApi } from '@/lib/api/dashboard.api'

const HEALTH_STYLES = {
  on_track: {
    label: 'On Track',
    dot: 'bg-green-500',
    text: 'text-green-600',
  },
  at_risk: {
    label: 'At Risk',
    dot: 'bg-amber-500',
    text: 'text-amber-600',
  },
  delayed: {
    label: 'Delayed',
    dot: 'bg-red-500',
    text: 'text-red-600',
  },
}

function Shell({ children }) {
  return (
    <Card className="h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-[30px] items-center justify-between px-3">
        <h3 className="truncate text-[11px] font-semibold text-slate-800">
          Project Health Overview
        </h3>

  
      </div>

      {children}
    </Card>
  )
}

export function ProjectHealth() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await dashboardApi.getProjectHealth()

        if (!cancelled) {
          setData(res)
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load project health.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Shell>
        <div className="flex h-[105px] items-center px-3">
          <div className="h-[78px] w-[78px] animate-pulse rounded-full bg-slate-100" />
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="flex h-[105px] items-center justify-center px-3">
          <p className="text-[9px] text-slate-500">
            {error}
          </p>
        </div>
      </Shell>
    )
  }

  const overall = data?.overallPercent ?? 0
  const projects = (data?.projects ?? []).slice(0, 4)

  const chartData = [
    {
      value: overall,
      fill: '#7C3AED',
    },
  ]

  return (
    <Shell>
      <div className="flex h-[105px] items-center px-3 pb-2">

        {/* LEFT DONUT */}
        <div className="flex w-[92px] shrink-0 items-center">
          <RadialBarChart
            width={88}
            height={88}
            data={chartData}
            innerRadius="68%"
            outerRadius="88%"
            startAngle={90}
            endAngle={-270}
            barSize={7}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              tick={false}
            />

            <RadialBar
              dataKey="value"
              background={{ fill: '#ECEEF3' }}
              cornerRadius={20}
            />

            <text
              x="50%"
              y="42%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-500 text-[6px]"
            >
              Health
            </text>

            <text
              x="50%"
              y="59%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-900 text-[15px] font-bold"
            >
              {overall}%
            </text>
          </RadialBarChart>
        </div>

        {/* RIGHT INFO */}
        <div className="min-w-0 flex-1 pl-2">
          <div className="space-y-2">
            {projects.map((project) => {
              const style =
                HEALTH_STYLES[project.health] ??
                HEALTH_STYLES.on_track

              return (
                <div
                  key={project.id}
                  className="flex min-w-0 items-center justify-between gap-2"
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`}
                    />

                    <span className="truncate text-[9px] font-medium text-slate-600">
                      {project.name}
                    </span>
                  </div>

                  <span
                    className={`shrink-0 text-[8px] font-medium ${style.text}`}
                  >
                    {style.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Shell>
  )
}