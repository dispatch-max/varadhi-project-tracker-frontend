'use client'

import Link from 'next/link'
// import { Users, CheckCircle2, Calendar, MoreHorizontal } from 'lucide-react'
import { Users, CheckCircle2, Calendar } from 'lucide-react'
import { ProjectCardMenu } from './project-card-menu'
import { cn, calcProgress, formatDate, getInitials, getAvatarColor } from '@/utils'
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '@/constants'

// export function ProjectCard({ project }) {
export function ProjectCard({ project, onUpdated }) {
  const progress = calcProgress(
    project.completedTasksCount,
    project.tasksCount
  )

  return (
    <div className="bg-card rounded-xl border border-border p-5 hover:shadow-md transition-all hover:-translate-y-0.5">

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-md font-medium',
              PROJECT_STATUS_COLORS[project.status]
            )}>
              {PROJECT_STATUS_LABELS[project.status]}
            </span>
          </div>
          <Link href={`/projects/${project.id}`}>
            <h3 className="text-sm font-semibold text-foreground hover:text-violet-600 transition-colors truncate">
              {project.name}
            </h3>
          </Link>
        </div>
        <ProjectCardMenu project={project} onUpdated={onUpdated} />
        {/* <button className="text-slate-400 hover:text-muted-foreground p-1 rounded-lg hover:bg-background flex-shrink-0">
          <MoreHorizontal className="w-4 h-4" />
        </button> */}
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
        {project.description || 'No description provided.'}
      </p>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Progress</span>
          <span className="text-xs font-semibold text-foreground">
            {progress}%
          </span>
        </div>
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
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100">

        {/* Members */}
        <div className="flex items-center">
          <div className="flex -space-x-2">
            {project.members?.slice(0, 3).map((member) => (
              <div
                key={member.id}
                title={member.name}
                className={cn(
                  'w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold',
                  getAvatarColor(member.name)
                )}
              >
                {getInitials(member.name)}
              </div>
            ))}
            {project.members?.length > 3 && (
              <div className="w-6 h-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs text-muted-foreground font-medium">
                +{project.members.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-slate-400 ml-2">
            {project.members?.length || 0} members
          </span>
        </div>

        {/* Tasks count */}
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>
            {project.completedTasksCount}/{project.tasksCount}
          </span>
        </div>
      </div>

      {/* Due date */}
      {project.endDate && (
        <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
          <Calendar className="w-3 h-3" />
          <span>Due {formatDate(project.endDate)}</span>
        </div>
      )}

    </div>
  )
}