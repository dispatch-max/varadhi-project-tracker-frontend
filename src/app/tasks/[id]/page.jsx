'use client'
import { useAuthStore } from '@/store/auth.store'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Calendar, Flag, CircleDot, FolderOpen,
  Pencil, Trash2, Save, X, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { tasksApi } from '@/lib/api/tasks.api'
import { usersApi } from '@/lib/api/users.api'
import { TaskComments } from '@/components/tasks/task-comments'
import { formatDate, getInitials, getAvatarColor, cn } from '@/utils'

const STATUS_CONFIG = {
  todo:        { label: 'To Do',       color: 'bg-slate-100 text-muted-foreground' },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  in_review:   { label: 'In Review',   color: 'bg-amber-100 text-amber-700' },
  completed:   { label: 'Completed',   color: 'bg-green-100 text-green-700' },
}

const PRIORITY_CONFIG = {
  low:      { label: 'Low',      color: 'bg-slate-100 text-muted-foreground' },
  medium:   { label: 'Medium',   color: 'bg-blue-100 text-blue-700' },
  high:     { label: 'High',     color: 'bg-amber-100 text-amber-700' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700' },
}

function DetailsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-4 w-24 bg-slate-100 rounded" />
      <div className="bg-card rounded-xl border border-border p-6 space-y-4">
        <div className="h-6 w-1/3 bg-slate-100 rounded" />
        <div className="h-3 w-2/3 bg-slate-100 rounded" />
        <div className="h-3 w-1/2 bg-slate-100 rounded" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-card rounded-xl border border-border p-5 h-40" />
        ))}
      </div>
    </div>
  )
}

export default function TaskDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuthStore()

  const canManageTask =
  user?.role === 'admin' || user?.role === 'manager'
  const isEmployee = user?.role?.toLowerCase() === 'employee'

  const [task, setTask] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [editing, setEditing] = useState(searchParams.get('edit') === 'true')
  const [form, setForm] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Reassignment dropdown data. GET /users is admin/manager-only on the
  // backend, so only fetch it for roles that could actually use it —
  // employees would just get a 403 for a control that's disabled anyway.
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [usersError, setUsersError] = useState(false)

  async function loadUsers() {
    setUsersLoading(true)
    setUsersError(false)
    try {
      const response = await usersApi.getAll()
      const list = response?.data ?? response ?? []
      setUsers(Array.isArray(list) ? list : [])
    } catch (err) {
      setUsers([])
      setUsersError(true)
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    // loadUsers only calls setState after its internal await — same
    // traced-false-positive as this file's own fetchTask/notification-bell's
    // fetchNotifications (plain function referenced by name, not inline).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (canManageTask) loadUsers()
  }, [canManageTask])

  const fetchTask = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await tasksApi.getById(id)
      // Defensive: works whether getById returns the task directly or { data: task }
      const data = res?.data ?? res
      if (!data) throw new Error('Not found')
      setTask(data)
      setForm({
        title: data.title ?? '',
        description: data.description ?? '',
        userStory: data.userStory ?? '',
        acceptanceCriteria: data.acceptanceCriteria ?? '',
        status: data.status ?? 'todo',
        priority: data.priority ?? 'medium',
        dueDate: (data.dueDate || '').slice(0, 10), // ISO -> yyyy-mm-dd for date input
        assigneeId: data.assignee?.id ?? '',
      })
    } catch (err) {
      setError('Failed to load this task.')
      setTask(null)
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchTask()
  }, [fetchTask])

  function handleFormChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function cancelEdit() {
    if (task) {
      setForm({
        title: task.title ?? '',
        description: task.description ?? '',
        userStory: task.userStory ?? '',
        acceptanceCriteria: task.acceptanceCriteria ?? '',
        status: task.status ?? 'todo',
        priority: task.priority ?? 'medium',
        dueDate: (task.dueDate || '').slice(0, 10),
        assigneeId: task.assignee?.id ?? '',
      })
    }
    setEditing(false)
  }

  // async function handleSave() {
  //   setIsSaving(true)
  //   try {
      
  //     // const res = await tasksApi.update(id, form)
  //     const data = res?.data ?? res
  //     setTask(data ?? { ...task, ...form })
  //     setEditing(false)
  //   } catch (err) {
  //     window.alert('Failed to save changes. Please try again.')
  //   } finally {
  //     setIsSaving(false)
  //   }
  // }

//  async function handleSave() {
//     setIsSaving(true)
//     try {
//       const payload = {
//   ...form,
//   dueDate: form.dueDate?.trim() || null,
//   userStory: form.userStory?.trim() || null,
//   acceptanceCriteria: form.acceptanceCriteria?.trim() || null,

async function handleSave() {
  setIsSaving(true)
  try {
    // A status change is sent through PATCH /tasks/:id/status — the same
    // endpoint the Kanban board uses. Going through PUT /tasks/:id instead
    // only produces a generic "Task Updated" and skips both the
    // review-requested notification and the project milestone re-check.
    const statusChanged = form.status !== task.status

    const nonStatusChanged =
      form.title !== (task.title ?? '') ||
      form.description !== (task.description ?? '') ||
      form.userStory !== (task.userStory ?? '') ||
      form.acceptanceCriteria !== (task.acceptanceCriteria ?? '') ||
      form.priority !== task.priority ||
      form.dueDate !== (task.dueDate || '').slice(0, 10) ||
      (form.assigneeId || '') !== (task.assignee?.id || '')

    let latest = task

    if (nonStatusChanged) {
      // Sanitize — convert empty strings to null before sending to API.
      // status is deliberately null here so the field update can't also fire
      // a second, generic notification for the status move.
      const payload = {
        ...form,
        status:             null,
        dueDate:            form.dueDate?.trim()            || null,
        userStory:          form.userStory?.trim()          || null,
        acceptanceCriteria: form.acceptanceCriteria?.trim() || null,
        assigneeId:         form.assigneeId?.trim()          || null,
      }
      const res = await tasksApi.update(id, payload)
      latest = (res?.data ?? res) || latest
    }

    if (statusChanged) {
      const res = await tasksApi.updateStatus(id, form.status)
      latest = (res?.data ?? res) || latest
    }

    setTask(latest ?? { ...task, ...form })
    setEditing(false)
  } catch (err) {
    window.alert('Failed to save changes. Please try again.')
  } finally {
    setIsSaving(false)
  }
}

  async function handleDelete() {
    if (!task) return
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return
    setIsDeleting(true)
    try {
      await tasksApi.delete(id)
      router.push('/tasks')
    } catch (err) {
      window.alert('Failed to delete the task. Please try again.')
      setIsDeleting(false)
    }
  }

  if (isLoading) return <DetailsSkeleton />

  if (error || !task) {
    return (
      <div className="space-y-4">
        <Link
          href="/tasks"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tasks
        </Link>
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {error || 'Task not found.'} —{' '}
          <button onClick={fetchTask} className="underline font-medium">
            Retry
          </button>
        </div>
      </div>
    )
  }

  const status = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.todo
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium
  const projectName = task.project?.name ?? task.projectName ?? null
  const assignee = task.assignee ?? null
  const assigneeName = assignee?.name ?? task.assigneeName ?? null

  return (
    <div className="space-y-6">

      {/* Back link */}
      <Link
        href="/tasks"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tasks
      </Link>

      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="space-y-1.5">
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  disabled={isSaving || isEmployee}
                />
              </div>
            ) : (
              <div>
  {/* <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
    Title
  </h3> */}

  <div className="flex items-center gap-3 flex-wrap">
    <h2 className="text-2xl font-bold text-foreground">
      {task.title}
    </h2>

    <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', status.color)}>
      {status.label}
    </span>

    <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', priority.color)}>
      {priority.label}
    </span>
  </div>
</div>
              
            )}
          </div>

          {/* Actions */}
          {/* <div className="flex items-center gap-2 flex-shrink-0">
            {editing ? (
              <>
                <Button
                  type="button"
                  className="bg-violet-600 hover:bg-violet-700"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                    : <><Save className="w-4 h-4 mr-2" />Save</>}
                </Button>
                <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSaving}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  {isDeleting
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>
                    : <><Trash2 className="w-4 h-4 mr-2" />Delete</>}
                </Button>
              </>
            )}
          </div> */}
          {/* Actions */}
<div className="flex items-center gap-2 flex-shrink-0">
  {editing ? (
    <>
      <Button
        type="button"
        className="bg-violet-600 hover:bg-violet-700"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Save
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={cancelEdit}
        disabled={isSaving}
      >
        <X className="w-4 h-4 mr-2" />
        Cancel
      </Button>
    </>
  ) : (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setEditing(true)}
      >
        <Pencil className="w-4 h-4 mr-2" />
        Edit
      </Button>

      {canManageTask && (
        <Button
          type="button"
          variant="outline"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          {isDeleting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </>
          )}
        </Button>
      )}
    </>
  )}
</div>
        </div>

{/* Description */}
{editing ? (
  <>
    <div className="space-y-1.5 mt-4">
      <Label htmlFor="description">Description</Label>
      <textarea
        id="description"
        name="description"
        value={form.description}
        onChange={handleFormChange}
        disabled={isSaving || isEmployee}
        rows={3}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none placeholder:text-slate-400"
      />
    </div>

    <div className="space-y-1.5 mt-4">
      <Label htmlFor="userStory">User Story</Label>
      <textarea
        id="userStory"
        name="userStory"
        value={form.userStory}
        onChange={handleFormChange}
        disabled={isSaving || isEmployee}
        rows={3}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none placeholder:text-slate-400"
      />
    </div>

    <div className="space-y-1.5 mt-4">
      <Label htmlFor="acceptanceCriteria">Acceptance Criteria</Label>
      <textarea
        id="acceptanceCriteria"
        name="acceptanceCriteria"
        value={form.acceptanceCriteria}
        onChange={handleFormChange}
        disabled={isSaving || isEmployee}
        rows={4}
        className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none placeholder:text-slate-400"
      />
    </div>
  </>
) : (
  <>
    {task.description && (
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Description
        </h3>

        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {task.description}
          </p>
        </div>
      </div>
    )}

    {task.userStory && (
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-2">
          User Story
        </h3>

        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {task.userStory}
          </p>
        </div>
      </div>
    )}

    {task.acceptanceCriteria && (
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-foreground mb-2">
          Acceptance Criteria
        </h3>

        <div className="rounded-lg border border-border bg-background p-4">
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {task.acceptanceCriteria}
          </p>
        </div>
      </div>
    )}
  </>
)}
</div>
      {/* Details cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Overview */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Details</h3>

          {editing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleFormChange}
                    disabled={isSaving}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-card"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="in_review">In Review</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="priority">Priority</Label>
                  <select
                    id="priority"
                    name="priority"
                    value={form.priority}
                    onChange={handleFormChange}
                    disabled={isSaving || isEmployee}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-card  "
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={form.dueDate}
                  onChange={handleFormChange}
                  disabled={isSaving || isEmployee}
                />
              </div>
            </div>
          ) : (
            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-400 inline-flex items-center gap-1.5">
                  <CircleDot className="w-3.5 h-3.5" /> Status
                </dt>
                <dd>
                  <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', status.color)}>
                    {status.label}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400 inline-flex items-center gap-1.5">
                  <Flag className="w-3.5 h-3.5" /> Priority
                </dt>
                <dd>
                  <span className={cn('text-xs px-2 py-0.5 rounded-md font-medium', priority.color)}>
                    {priority.label}
                  </span>
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400 inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Due date
                </dt>
                <dd className="text-foreground font-medium">
                  {task.dueDate ? formatDate(task.dueDate) : '—'}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-400 inline-flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5" /> Project
                </dt>
                <dd className="text-foreground font-medium">{projectName ?? '—'}</dd>
              </div>
            </dl>
          )}
        </div>

        {/* Assignee */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Assignee</h3>
          {editing ? (
            <div className="space-y-1.5">
              <Label htmlFor="assigneeId">Reassign to</Label>
              <select
                id="assigneeId"
                name="assigneeId"
                value={form.assigneeId}
                onChange={handleFormChange}
                disabled={isSaving || isEmployee || usersLoading}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="">
                  {usersLoading ? 'Loading users...' : 'Unassigned'}
                </option>
                {/* Employees never fetch the full user list (GET /users is
                    admin/manager-only), so fall back to the task's own
                    assignee data to still show the correct name here. */}
                {!canManageTask && assignee && (
                  <option value={assignee.id}>{assigneeName}</option>
                )}
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
              {usersError && (
                <p className="text-amber-600 text-xs">
                  Couldn&apos;t load users.{' '}
                  <button
                    type="button"
                    onClick={loadUsers}
                    className="underline font-medium"
                  >
                    Retry
                  </button>
                </p>
              )}
            </div>
          ) : assigneeName ? (
            <div className="flex items-center gap-2.5">
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
                getAvatarColor(assigneeName)
              )}>
                {getInitials(assigneeName)}
              </div>
              <span className="text-sm text-foreground">{assigneeName}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400">Unassigned</p>
          )}
        </div>
      </div>

      {/* Comments — posting here is what triggers the existing
          TASK_COMMENT / TASK_MENTION notifications. */}
      <TaskComments
        taskId={id}
        projectId={task.project?.id}
        comments={task.comments || []}
        currentUserId={user?.id}
        onTaskUpdated={(updated) => setTask(updated)}
      />

    </div>
  )
}
