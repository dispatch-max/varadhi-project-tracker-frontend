'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, MoreHorizontal, Flag } from 'lucide-react'
import { dashboardApi } from '@/lib/api/dashboard.api'

// Cycled per row so adjacent bars stay distinguishable.
const BAR_COLORS = [
  'bg-gradient-to-r from-indigo-600 to-violet-500',
  'bg-gradient-to-r from-violet-600 to-purple-500',
  'bg-gradient-to-r from-emerald-500 to-teal-400',
  'bg-gradient-to-r from-indigo-500 to-violet-400',
]

const shortDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : '—'

// Four evenly spaced ticks across the real window.
function axisTicks(startIso, endIso) {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return []
  return Array.from({ length: 4 }, (_, i) =>
    shortDate(new Date(start + ((end - start) * i) / 3))
  )
}

function Shell({ children }) {
  return (
    <div
      className="
        relative h-[320px] overflow-hidden rounded-3xl border border-white/30
        bg-gradient-to-br from-violet-100/80 via-purple-50/60 to-blue-100/70
        p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] flex flex-col
      "
    >
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />

      <div className="relative z-10 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500">
            <CalendarDays className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Gantt Timeline Preview
          </h3>
        </div>
        <MoreHorizontal className="h-4 w-4 cursor-pointer text-slate-400" />
      </div>

      {children}
    </div>
  )
}

export function GanttPreview() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const result = await dashboardApi.getGantt()
        if (!cancelled) setData(result)
      } catch {
        if (!cancelled) setError('Failed to load timeline.')
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
        <div className="flex-1 animate-pulse space-y-3 rounded-2xl border border-white/50 bg-card/60 p-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-7 rounded-full bg-slate-100" style={{ width: `${60 - i * 8}%` }} />
          ))}
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/50 bg-card/60">
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </Shell>
    )
  }

  // Projects need both a start and an end date to be placed on a timeline;
  // the endpoint excludes any that lack them.
  const projects = (data?.projects ?? []).slice(0, 4)

  if (projects.length === 0) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl border border-white/50 bg-card/60 px-6 text-center">
          <p className="text-sm text-muted-foreground">No scheduled projects.</p>
          <p className="text-xs text-slate-400">
            Projects need a start and end date to appear on the timeline.
          </p>
        </div>
      </Shell>
    )
  }

  const ticks = axisTicks(data.windowStart, data.windowEnd)

  return (
    <Shell>
      <div className="relative flex-1 overflow-hidden rounded-2xl border border-white/50 bg-card/60 backdrop-blur-md">
        <div className="grid grid-cols-4 border-b border-border text-center text-xs text-muted-foreground">
          {ticks.map((t, i) => (
            <div key={i} className="py-3">{t}</div>
          ))}
        </div>

        <div className="absolute inset-0 top-10 grid grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border-r border-slate-100" />
          ))}
        </div>

        <div className="absolute inset-0 top-12 px-1">
          {projects.map((project, index) => (
            <div
              key={project.id}
              title={`${project.name} · ${shortDate(project.startDate)} – ${shortDate(project.endDate)} · ${project.percent}% complete`}
              className={`absolute flex h-7 items-center justify-between rounded-full px-3 text-[10px] font-medium text-white shadow-md ${
                BAR_COLORS[index % BAR_COLORS.length]
              }`}
              style={{
                top: `${index * 38 + 4}px`,
                left: `${project.offsetPercent}%`,
                width: `${Math.max(project.widthPercent, 12)}%`,
              }}
            >
              <div className="flex min-w-0 items-center gap-1">
                <Flag className="h-3 w-3 shrink-0" />
                <span className="truncate">{project.name}</span>
              </div>

              <span className="ml-2 whitespace-nowrap text-[9px]">
                {shortDate(project.startDate)} – {shortDate(project.endDate)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  )
}
