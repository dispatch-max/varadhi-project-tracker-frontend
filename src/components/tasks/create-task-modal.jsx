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

  // useEffect(() => {
  //   loadProjects()
  // }, [])
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
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white rounded-t-2xl">
          <h2 className="text-base font-semibold text-slate-800">
            Create New Task
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {errors.general}
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="e.g. Build login page UI"
              value={formData.title}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.title && (
              <p className="text-red-500 text-xs">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              placeholder="Describe the task in detail..."
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none placeholder:text-slate-400"
            />
          </div>


          {/* User Story */}
          <div className="space-y-1.5">
              <Label htmlFor="userStory">User Story</Label>
                <textarea
                  id="userStory"
                  name="userStory"
                  // placeholder={`As a [user type],
                  // I want [action],
                  // So that [benefit]`}
                  value={formData.userStory}
                  onChange={handleChange}
                  disabled={isLoading}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              />
          </div>

            {/* Acceptance Criteria */}
                          <div className="space-y-1.5">
                <Label htmlFor="acceptanceCriteria">
                  Acceptance Criteria
                </Label>

                <textarea
                  id="acceptanceCriteria"
                  name="acceptanceCriteria"
              //     placeholder={`• Criteria 1
              // • Criteria 2
              // • Criteria 3`}
                  value={formData.acceptanceCriteria}
                  onChange={handleChange}
                  disabled={isLoading}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
                </div>

          {/* Project */}
          <div className="space-y-1.5">
            <Label htmlFor="projectId">Project *</Label>
            <select
              id="projectId"
              name="projectId"
              value={formData.projectId}
              onChange={handleChange}
              disabled={isLoading || projectsLoading}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              <option value="">
                {projectsLoading ? 'Loading projects...' : 'Select a project...'}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}
                </option>
              ))}
            </select>
            {projectsError && (
              <p className="text-amber-600 text-xs">
                Couldn&apos;t load projects.{' '}
                <button
                  type="button"
                  onClick={loadProjects}
                  className="underline font-medium"
                >
                  Retry
                </button>
              </p>
            )}
            {!projectsLoading && !projectsError && projects.length === 0 && (
              <p className="text-slate-400 text-xs">
                No projects found. Create a project first.
              </p>
            )}
{/*               
              <option value="">Select a project...</option>
              {MOCK_PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select> */}

            {errors.projectId && (
              <p className="text-red-500 text-xs">{errors.projectId}</p>
            )}
          </div>

          {/* Type + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
                <option value="infra">Infra</option>
                <option value="research">Research</option>
                <option value="design">Design</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Assignee + Due Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="assigneeId">Assignee</Label>
              <select
                id="assigneeId"
                name="assigneeId"
                value={formData.assigneeId}
                onChange={handleChange}
                disabled={isLoading || usersLoading}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
              >
                <option value="">
                  {usersLoading ? 'Loading users...' : 'Unassigned'}
                </option>
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
            
                {/* <option value="">Unassigned</option>
                {MOCK_MEMBERS.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div> */}

            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
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

          {/* Status */}
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
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
              className="bg-violet-600 hover:bg-violet-700"
              disabled={isLoading}
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                : 'Create Task'
              }
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}