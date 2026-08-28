'use client'

import { useState } from 'react'
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

  // Manager picker and member checkboxes both read from this one fetch; the
  // old separate projectsApi.getMembers() effect duplicated the same /users
  // request and its result was no longer rendered anywhere.
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
  className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
  onClick={(e) => e.target === e.currentTarget && onClose()}
>
  <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl overflow-hidden">
    
    {/* Gradient Header */}
    <div className="flex items-start justify-between  p-6 ">
      <div>
        <h2 className="text-xl font-bold">Create New Project</h2>
        <p className="text-xs  mt-1">Fill in the details below to initialize a new project.</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="p-1.5 rounded-lg hover:bg-white/20 transition text-white"
      >
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* Modal Body / Form */}
    <form onSubmit={handleSubmit} className="p-6 space-y-2">

      {/* General Error */}
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
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
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none placeholder:text-slate-400"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* Assign Team Members */}
      <div className="space-y-1.5">
        <Label htmlFor="team">
          Assign Team Members *
        </Label>

        <select
          id="team"
          name="team"
          multiple
          value={formData.team}
          onChange={(e) => {
            const selected = Array.from(
              e.target.selectedOptions,
              option => Number(option.value)
            )

            setFormData({
              ...formData,
              team: selected
            })
          }}
          disabled={isLoading}
          className="
            w-full min-h-[100px]
            px-3 py-2
            text-sm
            border border-slate-200
            rounded-lg
            bg-white
            focus:ring-2
            focus:ring-violet-500
          "
        >
          {members.map((member) => (
            <option
              key={member.id}
              value={member.id}
            >
              {member.name}
            </option>
          ))}
        </select>

        <p className="text-xs text-slate-400">
          Hold Ctrl (or Cmd on Mac) to select multiple members
        </p>
      </div>

      {/* Footer Buttons */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
          className="bg-violet-600 hover:bg-violet-700 text-white"
          disabled={isLoading}
        >
          {isLoading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
          ) : (
            'Create Project'
          )}
        </Button>
      </div>

    </form>
  </div>
</div>
  )
}