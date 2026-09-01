'use client'

import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { tasksApi } from '@/lib/api/tasks.api'
import { projectsApi } from '@/lib/api/projects.api'
import { usersApi } from '@/lib/api/users.api'
``



export function CreateTaskModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    userStory: '',
    acceptanceCriteria: '',
    type: 'feature',
    priority: 'medium',
    status: 'todo',
    projectId: '',
    assigneeId: '',
    dueDate: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

    // Real projects fetched from the backend (replaces MOCK_PROJECTS)
  const [projects, setProjects] = useState([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState(false)

    // Real users fetched from the backend (replaces MOCK_MEMBERS)
    const [users, setUsers] = useState([])
    const [usersLoading, setUsersLoading] = useState(true)
    const [usersError, setUsersError] = useState(false)

  async function loadProjects() {
    setProjectsLoading(true)
    setProjectsError(false)
    try {
      const response = await projectsApi.getAll()
      // Defensive: works whether getAll returns the array directly or { data: [...] }
      const list = response?.data ?? response ?? []
      setProjects(Array.isArray(list) ? list : [])
    } catch (err) {
      setProjects([])
      setProjectsError(true)
    } finally {
      setProjectsLoading(false)
    }
  }

    async function loadUsers() {
    setUsersLoading(true)
    setUsersError(false)
    try {
      const response = await usersApi.getAll()
      // Defensive: works whether getAll returns the array directly or { data: [...] }
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
    loadProjects()
    loadUsers()
  }, [])

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  function validate() {
    const newErrors = {}
    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required.'
    }
    if (!formData.projectId) {
      newErrors.projectId = 'Please select a project.'
    }
    return newErrors
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsLoading(true)
    try {
      await tasksApi.create(formData)
      onSuccess?.()
      onClose()
    } catch (err) {
      setErrors({
        general:
          err.response?.data?.message ||
          'Failed to create task. Try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

return (
  <div
    className="
      fixed inset-0 z-50
      flex items-center justify-center
      bg-black/50
      px-6 py-4
    "
    onClick={(e) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    }}
  >
    {/* =====================================================
        MODAL
        WIDE HORIZONTALLY
        HEIGHT IS NOT FORCED
    ====================================================== */}
    <div
      className="
        w-[92vw]
        max-w-[1400px]
        min-w-0
        max-h-[calc(100vh-32px)]
        overflow-hidden
        rounded-2xl
        bg-card
        shadow-xl
      "
    >
      {/* ===================================================
          HEADER
      ==================================================== */}
      <div
        className="
          sticky top-0 z-10
          flex items-center justify-between
          border-b border-border
          bg-card
          px-6 py-4
          rounded-t-2xl
        "
      >
        <h2 className="text-lg font-semibold text-foreground">
          Create New Task
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="
            rounded-lg p-1
            text-slate-400
            transition
            hover:bg-background
            hover:text-muted-foreground
          "
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ===================================================
          BODY
      ==================================================== */}
      <form
        onSubmit={handleSubmit}
        className="space-y-3 px-7 py-4"
      >
        {errors.general && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {errors.general}
          </div>
        )}

        {/* =================================================
            TITLE
        ================================================== */}
        <div className="space-y-1.5">
          <Label htmlFor="title">
            Task Title
          </Label>

          <Input
            id="title"
            name="title"
            placeholder="e.g. Build login page UI"
            value={formData.title}
            onChange={handleChange}
            disabled={isLoading}
          />

          {errors.title && (
            <p className="text-xs text-red-500">
              {errors.title}
            </p>
          )}
        </div>

        {/* =================================================
            DESCRIPTION + USER STORY
            Two columns because modal is now horizontal
        ================================================== */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* DESCRIPTION */}
          <div className="space-y-1.5">
            <Label htmlFor="description">
              Description
            </Label>

            <textarea
              id="description"
              name="description"
              placeholder="Describe the task in detail..."
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows={2}
              className="
                w-full resize-none
                rounded-lg
                border border-border
                px-3 py-2
                text-sm
                placeholder:text-slate-400
                focus:outline-none
                focus:ring-2
                focus:ring-violet-500
              "
            />
          </div>

          {/* USER STORY */}
          <div className="space-y-1.5">
            <Label htmlFor="userStory">
              User Story
            </Label>

            <textarea
              id="userStory"
              name="userStory"
              value={formData.userStory}
              onChange={handleChange}
              disabled={isLoading}
              rows={3}
              className="
                w-full resize-none
                rounded-lg
                border border-border
                px-3 py-2
                text-sm
                focus:outline-none
                focus:ring-2
                focus:ring-violet-500
              "
            />
          </div>
        </div>

        {/* =================================================
            ACCEPTANCE CRITERIA
        ================================================== */}
        <div className="space-y-1.5">
          <Label htmlFor="acceptanceCriteria">
            Acceptance Criteria
          </Label>

          <textarea
            id="acceptanceCriteria"
            name="acceptanceCriteria"
            value={formData.acceptanceCriteria}
            onChange={handleChange}
            disabled={isLoading}
            rows={3}
            className="
              w-full resize-none
              rounded-lg
              border border-border
              px-3 py-2
              text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-violet-500
            "
          />
        </div>

        {/* =================================================
            PROJECT
        ================================================== */}
        <div className="space-y-1.5">
          <Label htmlFor="projectId">
            Project *
          </Label>

          <select
            id="projectId"
            name="projectId"
            value={formData.projectId}
            onChange={handleChange}
            disabled={isLoading || projectsLoading}
            className="
              w-full
              rounded-lg
              border border-border
              bg-card
              px-3 py-2
              text-sm
              focus:outline-none
              focus:ring-2
              focus:ring-violet-500
            "
          >
            <option value="">
              {projectsLoading
                ? 'Loading projects...'
                : 'Select a project...'}
            </option>

            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          {projectsError && (
            <p className="text-xs text-amber-600">
              Couldn&apos;t load projects.{' '}
              <button
                type="button"
                onClick={loadProjects}
                className="font-medium underline"
              >
                Retry
              </button>
            </p>
          )}

          {!projectsLoading &&
            !projectsError &&
            projects.length === 0 && (
              <p className="text-xs text-slate-400">
                No projects found. Create a project first.
              </p>
            )}

          {errors.projectId && (
            <p className="text-xs text-red-500">
              {errors.projectId}
            </p>
          )}
        </div>

        {/* =================================================
            ASSIGNEE + DUE DATE
        ================================================== */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

          {/* ASSIGNEE */}
          <div className="space-y-1.5">
            <Label htmlFor="assigneeId">
              Assignee
            </Label>

            <select
              id="assigneeId"
              name="assigneeId"
              value={formData.assigneeId}
              onChange={handleChange}
              disabled={isLoading || usersLoading}
              className="
                w-full
                rounded-lg
                border border-border
                bg-card
                px-3 py-2
                text-sm
                focus:outline-none
                focus:ring-2
                focus:ring-violet-500
              "
            >
              <option value="">
                {usersLoading ? 'Loading users...' : 'Unassigned'}
              </option>

              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>

            {usersError && (
              <p className="text-xs text-amber-600">
                Couldn&apos;t load users.{' '}
                <button
                  type="button"
                  onClick={loadUsers}
                  className="font-medium underline"
                >
                  Retry
                </button>
              </p>
            )}
          </div>

          {/* DUE DATE */}
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">
              Due Date
            </Label>

            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={handleChange}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* =================================================
            TYPE + PRIORITY + STATUS
        ================================================== */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">

          {/* TYPE */}
          <div className="space-y-1.5">
            <Label htmlFor="type">
              Type
            </Label>

            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              disabled={isLoading}
              className="
                w-full
                rounded-lg
                border border-border
                bg-card
                px-3 py-2
                text-sm
                focus:outline-none
                focus:ring-2
                focus:ring-violet-500
              "
            >
              <option value="feature">Feature</option>
              <option value="bug">Bug</option>
              <option value="infra">Infra</option>
              <option value="research">Research</option>
              <option value="design">Design</option>
            </select>
          </div>

          {/* PRIORITY */}
          <div className="space-y-1.5">
            <Label htmlFor="priority">
              Priority
            </Label>

            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              disabled={isLoading}
              className="
                w-full
                rounded-lg
                border border-border
                bg-card
                px-3 py-2
                text-sm
                focus:outline-none
                focus:ring-2
                focus:ring-violet-500
              "
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          {/* STATUS */}
          <div className="space-y-1.5">
            <Label htmlFor="status">
              Status
            </Label>

            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={isLoading}
              className="
                w-full
                rounded-lg
                border border-border
                bg-card
                px-3 py-2
                text-sm
                focus:outline-none
                focus:ring-2
                focus:ring-violet-500
              "
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        {/* =================================================
            FOOTER
        ================================================== */}
        <div
          className="
            flex items-center justify-end
            gap-3
            border-t border-border
            pt-3
          "
        >
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isLoading}
            className="
              bg-violet-600
              hover:bg-violet-700
            "
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Task'
            )}
          </Button>
        </div>
      </form>
    </div>
  </div>
)
}