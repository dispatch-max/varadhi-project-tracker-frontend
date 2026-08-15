'use client'

import { useEffect, useState } from 'react'
import { reportsApi } from '@/lib/api/reports.api'

function Shell({ children }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="mb-5">
        <h3 className="text-base font-semibold text-foreground">Project Progress</h3>
        <p className="text-sm text-muted-foreground">
          Completion status across projects
        </p>
      </div>
      {children}
    </div>
  )
}

export function ProjectProgressChart() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        // Reuses the existing endpoint returning { name, completed, total }.
        const data = await reportsApi.getProjectCompletion()
        if (cancelled) return
        const rows = (data ?? [])
          // A project with no tasks has no meaningful progress bar.
          .filter((p) => (p.total ?? 0) > 0)
          .map((p) => ({
            name: p.name,
            completed: p.completed,
            total: p.total,
            progress: Math.round((p.completed / p.total) * 100),
          }))
          .sort((a, b) => b.progress - a.progress)
        setProjects(rows)
      } catch {
        if (!cancelled) setError('Failed to load project progress.')
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
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-3 w-32 rounded bg-slate-100" />
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

  if (projects.length === 0) {
    return (
      <Shell>
        <p className="py-4 text-sm text-muted-foreground">
          No projects with tasks yet.
        </p>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="space-y-4">
        {projects.map((project) => (
          <div key={project.name}>
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="truncate text-sm text-foreground">{project.name}</span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {project.completed}/{project.total} · {project.progress}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-violet-500"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Shell>
  )
}
