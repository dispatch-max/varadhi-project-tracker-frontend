
'use client'
import { TaskTabs } from './task-tabs'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

function TaskActionsMenu({ task, onDeleted, onEdit, openUp = false }) {
  const router = useRouter()
  const { user } = useAuthStore()

  const canManageTask =
  user?.role === "admin" || user?.role === "manager"
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
  <div className="relative inline-block">
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v) }}
        className="text-slate-400 hover:text-muted-foreground p-1 rounded hover:bg-slate-100"
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
<div
  className={`absolute right-0 w-44 bg-card border border-border rounded-xl shadow-lg z-[9999] py-1 ${
    openUp ? "bottom-full mb-2" : "top-full mt-2"
  }`}
>
            <button onClick={handleView} className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-background flex items-center gap-2">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              View Task
            </button>
            <button onClick={handleEdit} className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-background flex items-center gap-2">
              <Pencil className="w-3.5 h-3.5 text-slate-400" />
              Edit Task
            </button>
            {canManageTask && (
  <>
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
  </>
)}
            {/* <div className="border-t border-slate-100 my-1" />
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
            </button> */}
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
  const searchParams = useSearchParams()



  // ---- NEW real API state ----
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  // 'all' | 'mine' — drives the TaskTabs assignee scope.
  const [scope, setScope] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  // Pagination
const [currentPage, setCurrentPage] = useState(1)
const TASKS_PER_PAGE = 15

  // Picks up a search term the topbar navigated here with (?search=...),
  // including when this page is already mounted and the term changes.
  useEffect(() => {
    // Same traced-false-positive as elsewhere in this app (e.g.
    // use-has-mounted.js's setMounted(true)) — a plain setState with no
    // async work, safe to run directly in the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(searchParams.get('search') || '')
  }, [searchParams])


  // ---- NEW fetch from backend API ----
  async function fetchTasks() {
    setIsLoading(true)
    setError(null)
    try {
      const filters = {}
      if (statusFilter !== 'all') filters.status = statusFilter
      if (priorityFilter !== 'all') filters.priority = priorityFilter
      if (search) filters.search = search
      // "My Tasks" scope. Employees are already restricted to their own rows
      // server-side, so this only changes what admins/managers see.
      if (scope === 'mine' && user?.id) filters.assigneeId = user.id
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
    // Pagination
const indexOfLastTask = currentPage * TASKS_PER_PAGE
const indexOfFirstTask = indexOfLastTask - TASKS_PER_PAGE

const currentTasks = tasks.slice(
  indexOfFirstTask,
  indexOfLastTask
)

const totalPages = Math.ceil(
  tasks.length / TASKS_PER_PAGE
)
    const timer = setTimeout(fetchTasks, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter, priorityFilter, scope])
  const indexOfLastTask = currentPage * TASKS_PER_PAGE

const indexOfFirstTask = indexOfLastTask - TASKS_PER_PAGE

const currentTasks = tasks.slice(
  indexOfFirstTask,
  indexOfLastTask
)

const totalPages = Math.ceil(
  tasks.length / TASKS_PER_PAGE
)


  return (
    <div>

      {/* Scope tabs — All Tasks / My Tasks */}
      <div className="mb-4">
        <TaskTabs
          active={scope}
          onChange={(next) => {
            setScope(next)
            setCurrentPage(1)
          }}
        />
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

        {/* Search */}
        <div className="relative flex-1 min-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-card placeholder:text-slate-400"
          />
        </div>
<div className="flex items-center gap-3">
        {/* Status Filter */}
<div className="h-[40px] w-[150px] overflow-y-auto border border-border rounded-lg bg-card p-2">
  <div className="flex flex-col gap-1">

    {[
      { value: 'all', label: 'All Status' },
      { value: 'todo', label: 'To Do' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'in_review', label: 'In Review' },
      { value: 'completed', label: 'Completed' },
    ].map((status) => (
      <button
        key={status.value}
        onClick={() => setStatusFilter(status.value)}
        className={cn(
          'w-full text-left px-2 py-1 rounded-md text-sm transition',
          statusFilter === status.value
            ? 'bg-violet-600 text-white'
            : 'text-foreground hover:bg-slate-100'
        )}
      >
        {status.label}
      </button>
    ))}

  </div>
</div>
        {/* Priority Filter */}
<div className="h-[40px] w-[150px] overflow-y-auto border border-border rounded-lg bg-card p-2">
  <div className="flex flex-col gap-1">

    {[
      { value: 'all', label: 'All Priority' },
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'critical', label: 'Critical' },
    ].map((status) => (
      <button
        key={status.value}
        onClick={() => setStatusFilter(status.value)}
        className={cn(
          'w-full text-left px-2 py-1 text-sm rounded-md transition',
          statusFilter === status.value
            ? 'bg-violet-600 text-white'
            : 'hover:bg-slate-100 text-foreground'
        )}
      >
        {status.label}
      </button>
    ))}

  </div>
</div>
</div>
        {/* Create Button */}
        {canCreateTask && (
  <Button
    onClick={() => setShowCreateModal(true)}
    className="bg-violet-600 hover:bg-violet-700 shrink-0"
  >
    <Plus className="w-4 h-4 mr-2" />
    New Task
  </Button>
)}
        {/* <Button
          onClick={() => setShowCreateModal(true)}
          className="bg-violet-600 hover:bg-violet-700 flex-shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Button> */}
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
          Showing {indexOfFirstTask + 1}-
{Math.min(indexOfLastTask, tasks.length)}
 of {tasks.length} tasks
        </p>
      )}

      {/* Tasks Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">  
            <thead>
              <tr className="border-b border-slate-100 bg-background">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground w-full">
                  Task
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Project
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Priority
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  Assignee
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground whitespace-nowrap">
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
                currentTasks.map((task) => {
                  const overdue =
                    task.dueDate &&
                    task.status !== 'completed' &&
                    isOverdue(task.dueDate)

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-background transition-colors"
                    >
     
                      {/* Title */}
                    <td className="px-4 py-4">
                    <p className="text-base font-semibold text-foreground max-w-sm whitespace-normal break-words"> {task.title} </p>
                     </td>
                      {/* Project */}
                      <td className="px-4 py-3">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
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
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
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
                            overdue ? 'text-red-500' : 'text-muted-foreground'
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
                       //to open up bar 
                       openUp={
currentTasks.indexOf(task) >=
currentTasks.length - 2
}
                       />
                      </td>
                      {/* <td className="px-4 py-3">
                        <button className="text-slate-400 hover:text-muted-foreground p-1 rounded hover:bg-slate-100">
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
                    <p className="text-sm font-medium text-muted-foreground">No tasks found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Try changing your filters or create a new task
                    </p>
                  </td>
                </tr>
              )}

            </tbody>
          </table>
          <div className="flex items-center justify-between border-t border-border px-6 py-4">

  <p className="text-sm text-muted-foreground">
    Showing {indexOfFirstTask + 1}-
    {Math.min(indexOfLastTask, tasks.length)}
    of {tasks.length} tasks
  </p>

  <div className="flex items-center gap-2">

    <button
      disabled={currentPage === 1}
      onClick={() =>
        setCurrentPage(currentPage - 1)
      }
      className="px-3 py-2 rounded-lg border border-border text-sm disabled:opacity-50"
    >
      Previous
    </button>

    {Array.from(
      { length: totalPages },
      (_, index) => (
        <button
          key={index}
          onClick={() =>
            setCurrentPage(index + 1)
          }
          className={cn(
            "w-9 h-9 rounded-lg text-sm transition",
            currentPage === index + 1
              ? "bg-violet-600 text-white"
              : "border border-border hover:bg-slate-100"
          )}
        >
          {index + 1}
        </button>
      )
    )}

    <button
      disabled={currentPage === totalPages}
      onClick={() =>
        setCurrentPage(currentPage + 1)
      }
      className="px-3 py-2 rounded-lg border border-border text-sm disabled:opacity-50"
    >
      Next
    </button>

  </div>

</div>
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