'use client'

import { useState } from 'react'
import { X, Loader2, Mail, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usersApi } from '@/lib/api/users.api'

export function InviteUserModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    email: '',
    role: 'employee',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  function validate() {
    const newErrors = {}
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required.'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address.'
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
      await usersApi.invite(formData.email, formData.role)
      setIsSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      setErrors({
        general:
          err.response?.data?.message ||
          'Failed to send invite. Try again.',
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
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">
            Invite Team Member
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {/* Success */}
          {isSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Invite sent successfully!
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {errors.general}
            </div>
          )}

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 flex items-start gap-2">
            <Mail className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              An invitation email will be sent to the user. They can
              click the link to set their password and join the team.
            </p>
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="colleague@varadhi.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading || isSuccess}
            />
            {errors.email && (
              <p className="text-red-500 text-xs">{errors.email}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <Label htmlFor="role">Role *</Label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={isLoading || isSuccess}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
            >
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Role descriptions */}
          <div className="space-y-2 bg-slate-50 rounded-lg p-3">
            <p className="text-xs font-medium text-slate-600 mb-2">
              Role permissions:
            </p>
            {[
              {
                role: 'Employee',
                desc: 'View assigned tasks, update status, upload documents',
              },
              {
                role: 'Manager',
                desc: 'Create projects, assign tasks, manage team members',
              },
              {
                role: 'Admin',
                desc: 'Full access — manage users, roles, all projects',
              },
            ].map((item) => (
              <div key={item.role} className="flex items-start gap-2">
                <span className="text-xs font-medium text-slate-700 w-16 flex-shrink-0">
                  {item.role}
                </span>
                <span className="text-xs text-slate-500">{item.desc}</span>
              </div>
            ))}
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
              disabled={isLoading || isSuccess}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</>
              ) : isSuccess ? (
                <><CheckCircle2 className="w-4 h-4 mr-2" />Sent!</>
              ) : (
                <><Mail className="w-4 h-4 mr-2" />Send Invite</>
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}