
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Search, Calendar,
  AlertTriangle, MoreHorizontal,
  Eye, Pencil, Trash2
} from 'lucide-react'
// import {
//   Plus, Search, Calendar,
//   AlertTriangle, MoreHorizontal
// } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateTaskModal } from './create-task-modal'
import { StatusBadge, PriorityBadge, TypeBadge } from './task-badge'
import { useAuthStore } from '@/store/auth.store'
import { tasksApi } from '@/lib/api/tasks.api'
import {
  formatDate, isOverdue,
  getInitials, getAvatarColor, cn
} from '@/utils'
import { useHasMounted } from '@/hooks/use-has-mounted'


// Skeleton row for loading state
function TaskRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded w-48" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded w-24" /></td>
      <td className="px-4 py-3"><div className="h-5 bg-slate-100 rounded w-16" /></td>
      <td className="px-4 py-3"><div className="h-5 bg-slate-100 rounded w-16" /></td>
      <td className="px-4 py-3"><div className="h-5 bg-slate-100 rounded w-20" /></td>
      <td className="px-4 py-3"><div className="h-5 bg-slate-100 rounded w-16" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-slate-100 rounded w-16" /></td>
      <td className="px-4 py-3" />
    </tr>
  )
}

function TaskActionsMenu({ task, onDeleted, onEdit }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  function handleView() {
    setOpen(false)
    router.push(`/tasks/${task.id}`)
  }

  function handleEdit() {
    setOpen(false)
    if (onEdit) onEdit(task)
    else router.push(`/tasks/${task.id}?edit=true`)
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) {
      setOpen(false)
      return
    }
    setIsDeleting(true)
    try {
      await tasksApi.delete(task.id)
      setOpen(false)
      onDeleted?.()
    } catch (err) {
      window.alert('Failed to delete the task. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v) }}
        className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100"
        aria-label="Task actions"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(false) }}
          />
          <div className="absolute right-0 top-8 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">
            <button onClick={handleView} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              View Task
            </button>
            <button onClick={handleEdit} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-slate-400" />
              Edit Task
            </button>
            <div className="border-t border-slate-100 my-1" />
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className={cn(
                'w-full text-left px-3 py-2 text-sm hover:bg-red-50 flex items-center gap-2 text-red-500',
                isDeleting && 'opacity-50 cursor-not-allowed'
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {isDeleting ? 'Deleting…' : 'Delete Task'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export function TasksList() {
  const { user } = useAuthStore()
  const mounted = useHasMounted()
  const canCreateTask = mounted && ['admin', 'manager'].includes(user?.role)



  // ---- NEW real API state ----
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)


  // ---- NEW fetch from backend API ----
  async function fetchTasks() {
    setIsLoading(true)
    setError(null)
    try {
      const filters = {}
      if (statusFilter !== 'all') filters.status = statusFilter
      if (priorityFilter !== 'all') filters.priority = priorityFilter
      if (search) filters.search = search
      const response = await tasksApi.getAll(filters)
      setTasks(response.data || [])
    } catch (err) {
      setError('Failed to load tasks.')
      setTasks([])
    } finally {
      setIsLoading(false)
    }
  }

  // Debounced fetch — waits 300ms after filter/search change
  useEffect(() => {
    const timer = setTimeout(fetchTasks, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter, priorityFilter])


  return (
    <div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-700"
        >
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="in_review">In Review</option>
          <option value="completed">Completed</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-700"
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        {/* Create Button */}
        <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-violet-600 hover:bg-violet-700 flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
          {error} —{' '}
          <button onClick={fetchTasks} className="underline font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Results count — only show when not loading */}
      {!isLoading && (
        <p className="text-xs text-slate-400 mb-4">
          Showing {tasks.length} task{tasks.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Tasks Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 w-full">
                  Task
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                  Project
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                  Priority
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                  Assignee
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 whitespace-nowrap">
                  Due Date
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">

              {/* Loading skeletons */}
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TaskRowSkeleton key={i} />)

              /* Real task rows */
              ) : tasks.length > 0 ? (
                tasks.map((task) => {
                  const overdue =
                    task.dueDate &&
                    task.status !== 'completed' &&
                    isOverdue(task.dueDate)

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Title */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800 truncate max-w-xs">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-slate-400 truncate max-w-xs mt-0.5">
                            {task.description}
                          </p>
                        )}
                      </td>

                      {/* Project */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {task.project?.name}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <TypeBadge type={task.type} />
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3">
                        <PriorityBadge priority={task.priority} />
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={task.status} />
                      </td>

                      {/* Assignee */}
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
                          <span className="text-xs text-slate-400">Unassigned</span>
                        )}
                      </td>

                      {/* Due Date */}
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

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <TaskActionsMenu
                          task={task}
                          onDeleted={fetchTasks}
                        />
                      </td>
                      {/* <td className="px-4 py-3">
                        <button className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td> */}
                    </tr>
                  )
                })

              /* Empty state */
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">No tasks found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try changing your filters or create a new task
                    </p>
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchTasks()  // Refresh list after new task created
          }}
        />
      )}

    </div>
  )
}