'use client'

import { useState, useEffect, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, Users,
  CheckCircle2, Clock, AlertTriangle,
  FolderOpen, Pencil, Archive, Trash2,
  ListChecks
} from 'lucide-react'
import { projectsApi } from '@/lib/api/projects.api'
import { useAuthStore } from '@/store/auth.store'
import { EditProjectModal } from '@/components/projects/edit-project-modal'
import { StatusBadge, PriorityBadge, TypeBadge } from '@/components/tasks/task-badge'
import {
  PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS,
  TASK_STATUS_LABELS
} from '@/constants'
import {
  formatDate, calcProgress, getInitials,
  getAvatarColor, isOverdue, cn
} from '@/utils'

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-4 w-24 bg-slate-200 rounded" />
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="h-7 w-64 bg-slate-200 rounded mb-3" />
        <div className="h-4 w-full bg-slate-100 rounded mb-2" />
        <div className="h-4 w-2/3 bg-slate-100 rounded" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1,2,3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="h-7 w-12 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectDetailPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()

  const [project, setProject] = useState(null)
  const [tasks, setTasks]     = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [showEditModal, setShowEditModal] = useState(
    searchParams.get('edit') === 'true'
  )
  const [activeTab, setActiveTab] = useState('overview')

  const isAdmin   = user?.role === 'admin'
  const isManager = user?.role === 'manager'
  const canEdit   = isAdmin || isManager
  const canDelete = isAdmin

  async function fetchProject() {
    setIsLoading(true)
    setError(null)
    try {
      // Both calls in parallel — project detail + tasks
      const [projectData, tasksData] = await Promise.all([
        projectsApi.getById(id),
        projectsApi.getAll({}).then(() =>
          // Use the dedicated tasks endpoint
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/projects/${id}/tasks`, {
            headers: {
              Authorization: `Bearer ${JSON.parse(localStorage.getItem('varadhi_token') || 'null')}`
            }
          }).then(r => r.json()).then(r => r.data || [])
        ).catch(() => [])
      ])
      setProject(projectData)
      setTasks(tasksData)
    } catch (err) {
      setError('Failed to load project.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [id])

  async function handleArchive() {
    if (!confirm(`Archive "${project.name}"?`)) return
    try {
      await projectsApi.archive(id)
      router.push('/projects')
    } catch {
      alert('Failed to archive project.')
    }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete "${project.name}"? This cannot be undone.`)) return
    try {
      await projectsApi.delete(id)
      router.push('/projects')
    } catch {
      alert('Failed to delete project.')
    }
  }

  if (isLoading) return <PageSkeleton />

  if (error || !project) {
    return (
      <div className="text-center py-20">
        <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-3">
          <FolderOpen className="w-5 h-5 text-red-400" />
        </div>
        <p className="text-sm font-medium text-slate-700 mb-1">
          Project not found
        </p>
        <p className="text-xs text-slate-400 mb-4">
          {error || 'This project may have been deleted.'}
        </p>
        <Link
          href="/projects"
          className="text-sm text-violet-600 hover:underline font-medium"
        >
          ← Back to Projects
        </Link>
      </div>
    )
  }

  const progress = calcProgress(project.completedTasksCount, project.tasksCount)

  // Task breakdown by status
  const tasksByStatus = {
    todo:        tasks.filter(t => t.status === 'todo').length,
    in_progress: tasks.filter(t => t.status === 'in_progress').length,
    in_review:   tasks.filter(t => t.status === 'in_review').length,
    completed:   tasks.filter(t => t.status === 'completed').length,
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/projects"
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Projects
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-700 font-medium truncate">
          {project.name}
        </span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Status + Name */}
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-md font-medium',
                PROJECT_STATUS_COLORS[project.status]
              )}>
                {PROJECT_STATUS_LABELS[project.status]}
              </span>
            </div>
            <h1 className="text-2xl font-semibold text-slate-800 mb-2">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-sm text-slate-500 leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          {/* Action buttons */}
          {canEdit && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              {project.status !== 'archived' && (
                <button
                  onClick={handleArchive}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive
                </button>
              )}
              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Overall Progress</span>
            <span className="text-xs font-semibold text-slate-700">
              {progress}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
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
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-xs text-slate-400">
              {project.completedTasksCount} of {project.tasksCount} tasks completed
            </span>
            {project.endDate && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Due {formatDate(project.endDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: ListChecks,
            label: 'Total Tasks',
            value: project.tasksCount,
            color: 'bg-slate-50 text-slate-500'
          },
          {
            icon: CheckCircle2,
            label: 'Completed',
            value: tasksByStatus.completed,
            color: 'bg-green-50 text-green-500'
          },
          {
            icon: Clock,
            label: 'In Progress',
            value: tasksByStatus.in_progress,
            color: 'bg-amber-50 text-amber-500'
          },
          {
            icon: Users,
            label: 'Members',
            value: project.members?.length || 0,
            color: 'bg-violet-50 text-violet-500'
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl border border-slate-200 p-4"
            >
              <div className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center mb-3',
                stat.color
              )}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-semibold text-slate-800 leading-none mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-slate-500">{stat.label}</p>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200">
        {['overview', 'tasks', 'members'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium capitalize border-b-2 -mb-px transition-colors',
              activeTab === tab
                ? 'border-violet-600 text-violet-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {tab}
            {tab === 'tasks' && (
              <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                {tasks.length}
              </span>
            )}
            {tab === 'members' && (
              <span className="ml-1.5 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                {project.members?.length || 0}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Project Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">
              Project Info
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Manager',    value: project.manager?.name || 'Unassigned' },
                { label: 'Status',     value: PROJECT_STATUS_LABELS[project.status]  },
                { label: 'Start Date', value: project.startDate ? formatDate(project.startDate) : '—' },
                { label: 'End Date',   value: project.endDate   ? formatDate(project.endDate)   : '—' },
                { label: 'Created',    value: formatDate(project.createdAt) },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{item.label}</span>
                  <span className="text-xs font-medium text-slate-700">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Task Status Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="text-sm font-semibold text-slate-800 mb-4">
              Task Status Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(tasksByStatus).map(([status, count]) => {
                const pct = project.tasksCount > 0
                  ? Math.round((count / project.tasksCount) * 100)
                  : 0
                const colors = {
                  todo:        'bg-slate-300',
                  in_progress: 'bg-amber-400',
                  in_review:   'bg-blue-400',
                  completed:   'bg-green-500',
                }
                return (
                  <div key={status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">
                        {TASK_STATUS_LABELS[status]}
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', colors[status])}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: Tasks ── */}
      {activeTab === 'tasks' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {tasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ListChecks className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">No tasks yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Create tasks from the Tasks page
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">
                      Task
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">
                      Priority
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500">
                      Assignee
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                      Due Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((task) => {
                    const overdue =
                      task.dueDate &&
                      task.status !== 'completed' &&
                      isOverdue(task.dueDate)
                    return (
                      <tr
                        key={task.id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="text-sm font-medium text-slate-800 truncate max-w-xs">
                            {task.title}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <TypeBadge type={task.type} />
                        </td>
                        <td className="px-4 py-3">
                          <PriorityBadge priority={task.priority} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={task.status} />
                        </td>
                        <td className="px-4 py-3">
                          {task.assignee ? (
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
                                getAvatarColor(task.assignee.name)
                              )}>
                                {getInitials(task.assignee.name)}
                              </div>
                              <span className="text-xs text-slate-600 whitespace-nowrap">
                                {task.assignee.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {task.dueDate ? (
                            <div className={cn(
                              'flex items-center gap-1 text-xs whitespace-nowrap',
                              overdue ? 'text-red-500' : 'text-slate-500'
                            )}>
                              {overdue && <AlertTriangle className="w-3 h-3" />}
                              <Calendar className="w-3 h-3" />
                              {formatDate(task.dueDate, 'MMM dd')}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Members ── */}
      {activeTab === 'members' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {!project.members?.length ? (
            <div className="text-center py-16">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">No members yet</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
                    Member
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
                    Role
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-slate-500">
                    Tasks
                  </th>
                  {canEdit && (
                    <th className="px-5 py-3 text-xs font-medium text-slate-500">
                      Action
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {project.members.map((member) => {
                  const memberTasks = tasks.filter(
                    t => t.assignee?.id === member.id
                  )
                  return (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
                            getAvatarColor(member.name)
                          )}>
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">
                              {member.name}
                            </p>
                            <p className="text-xs text-slate-400">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs text-slate-600 capitalize">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-sm text-slate-600">
                          {memberTasks.length}
                        </span>
                      </td>
                      {canEdit && (
                        <td className="px-5 py-3">
                          {member.id !== project.manager?.id && (
                            <button
                              onClick={async () => {
                                if (!confirm(`Remove ${member.name} from this project?`)) return
                                try {
                                  await projectsApi.removeMember(project.id, member.id)
                                  fetchProject()
                                } catch {
                                  alert('Failed to remove member.')
                                }
                              }}
                              className="text-xs text-red-500 hover:text-red-600 hover:underline"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <EditProjectModal
          project={project}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            fetchProject()
          }}
        />
      )}

    </div>
  )
}