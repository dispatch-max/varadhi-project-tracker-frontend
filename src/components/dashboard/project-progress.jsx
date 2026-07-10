'use client'

import { useEffect, useState } from 'react'
import { calcProgress, cn } from '@/utils'
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '@/constants'
import { dashboardApi } from '@/lib/api/dashboard.api'
import Link from 'next/link'


export function ProjectProgress({ projects }) {
  // const items = projects || MOCK_PROJECTS
  const [items, setItems] = useState([])

useEffect(() => {
  async function loadProjects() {
    try {
      const data = await dashboardApi.getProjects()
      setItems(data)
    } catch (err) {
      console.error(err)
      setItems([])
    }
  }

  loadProjects()
}, [])

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-800">
          Project Progress
        </h3>
        <Link
  href="/projects"
  className="text-xs text-violet-600 hover:underline font-medium"
>
  View all
</Link>
      </div>

      <div className="space-y-4">
        {items.map((project) => {
          const progress = calcProgress(
            project.completedTasksCount,
            project.tasksCount
          )

          return (
            <div key={project.id}>
              {/* Project name + status */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">
                    {project.name}
                  </p>
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-md font-medium flex-shrink-0',
                    PROJECT_STATUS_COLORS[project.status]
                  )}>
                    {PROJECT_STATUS_LABELS[project.status]}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-600 ml-2 flex-shrink-0">
                  {progress}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    progress === 100
                      ? 'bg-green-500'
                      : progress > 60
                      ? 'bg-violet-500'
                      : progress > 30
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-slate-400">
                  {project.manager_name}
                </p>
                <p className="text-xs text-slate-400">
                  {project.completedTasksCount}/{project.tasksCount} tasks
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}