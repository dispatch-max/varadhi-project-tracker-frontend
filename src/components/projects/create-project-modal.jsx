'use client'

import { useState,useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { projectsApi } from '@/lib/api/projects.api'
import { useUsers, activeUsers, groupUsersForManagerPicker } from '@/hooks/use-users'
import { getInitials, getAvatarColor, cn } from '@/utils'

export function CreateProjectModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    // '' means "assign me as manager" — the backend already falls back to the
    // creator when managerId is absent.
    managerId: '',
    memberIds: [],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
const [members, setMembers] = useState([])
useEffect(() => {
  async function loadMembers() {
    try {
      const res = await projectsApi.getMembers()
      setMembers(res.data)
    } catch (error) {
      console.log("Failed to load members", error)
    }
  }

  loadMembers()
}, [])

  const { users, isLoading: usersLoading, error: usersError, reload: reloadUsers } = useUsers()
  const { privileged, employees } = groupUsersForManagerPicker(users)
  const selectableMembers = activeUsers(users)

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  function toggleMember(userId) {
    setFormData((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(userId)
        ? prev.memberIds.filter((id) => id !== userId)
        : [...prev.memberIds, userId],
    }))
  }

  function validate() {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required.'
    }
    if (!formData.startDate) {
      newErrors.startDate = 'Start date is required.'
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
      // '' -> null so the backend's `managerId || req.user.id` fallback
      // (assign the creator) reads clearly rather than relying on '' being falsy.
      await projectsApi.create({
        ...formData,
        managerId: formData.managerId || null,
      })
      onSuccess?.()
      onClose()
    } catch (err) {
      setErrors({
        general:
          err.response?.data?.message ||
          'Failed to create project. Try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-card rounded-2xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            Create New Project
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-muted-foreground p-1 rounded-lg hover:bg-background"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {errors.general}
            </div>
          )}

          {/* Project Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Varadhi Tracker Backend"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
            />
            {errors.name && (
              <p className="text-red-500 text-xs">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              placeholder="Brief description of the project..."
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none placeholder:text-slate-400"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                disabled={isLoading}
              />
              {errors.startDate && (
                <p className="text-red-500 text-xs">{errors.startDate}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>
          {/* Project Manager — drives who receives overdue alerts,
              48h escalations and milestone notifications. */}
          <div className="space-y-1.5">
            <Label htmlFor="managerId">Project Manager</Label>
            <select
              id="managerId"
              name="managerId"
              value={formData.managerId}
              onChange={handleChange}
              disabled={isLoading || usersLoading}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              <option value="">
                {usersLoading ? 'Loading users...' : 'Assign me as manager'}
              </option>
              {privileged.length > 0 && (
                <optgroup label="Managers & Admins">
                  {privileged.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </optgroup>
              )}
              {employees.length > 0 && (
                <optgroup label="Employees">
                  {employees.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </optgroup>
              )}
            </select>
            <p className="text-xs text-slate-400">
              The manager receives overdue alerts, escalations and milestone updates.
            </p>
          </div>

          {/* Team members — each person selected is notified they were added. */}
          <div className="space-y-1.5">
            <Label>Team Members</Label>
            {usersLoading ? (
              <p className="text-xs text-slate-400">Loading users...</p>
            ) : usersError ? (
              <p className="text-amber-600 text-xs">
                Couldn&apos;t load users.{' '}
                <button type="button" onClick={reloadUsers} className="underline font-medium">
                  Retry
                </button>
              </p>
            ) : selectableMembers.length === 0 ? (
              <p className="text-xs text-slate-400">No other active users yet.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                {selectableMembers.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.memberIds.includes(u.id)}
                      onChange={() => toggleMember(u.id)}
                      disabled={isLoading}
                      className="rounded border-slate-300"
                    />
                    <span
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0',
                        getAvatarColor(u.name || '?')
                      )}
                    >
                      {getInitials(u.name || '?')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-slate-700 truncate">{u.name}</span>
                      <span className="block text-xs text-slate-400 truncate capitalize">{u.role}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400">
              Members are notified they were added, and can be @mentioned in comments.
            </p>
          </div>

          {/* Footer Buttons */}
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
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                : 'Create Project'
              }
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}