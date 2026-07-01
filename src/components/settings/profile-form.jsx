'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/store/auth.store'
import { usersApi } from '@/lib/api/users.api'
import { getInitials, getAvatarColor, cn } from '@/utils'
import { USER_ROLE_LABELS } from '@/constants'

export function ProfileForm() {
  const { user, setAuth } = useAuthStore()

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
    setIsSuccess(false)
  }

  function validate() {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required.'
    }
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
      const updatedUser = await usersApi.updateProfile(formData)
      // Update auth store with new user data
      setAuth(updatedUser, user?.token || '')
      setIsSuccess(true)
    } catch (err) {
      setErrors({
        general:
          err.response?.data?.message ||
          'Failed to update profile. Try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-sm font-semibold text-slate-800 mb-5">
        Profile Information
      </h3>

      {/* Avatar Section */}
      <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
        <div className="relative">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold',
            getAvatarColor(user?.name || 'U')
          )}>
            {getInitials(user?.name || 'User')}
          </div>
          <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-violet-600 rounded-full flex items-center justify-center text-white hover:bg-violet-700 transition-colors">
            <Camera className="w-3 h-3" />
          </button>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {user?.name}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {user?.email}
          </p>
          <span className="inline-block mt-1.5 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-md font-medium capitalize">
            {USER_ROLE_LABELS[user?.role] || user?.role}
          </span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Success */}
        {isSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Profile updated successfully!
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {errors.general}
          </div>
        )}

        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="Your full name"
          />
          {errors.name && (
            <p className="text-red-500 text-xs">{errors.name}</p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            placeholder="your@email.com"
          />
          {errors.email && (
            <p className="text-red-500 text-xs">{errors.email}</p>
          )}
        </div>

        {/* Role — read only */}
        <div className="space-y-1.5">
          <Label>Role</Label>
          <div className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-500 capitalize">
            {USER_ROLE_LABELS[user?.role] || user?.role}
            <span className="text-xs text-slate-400 ml-2">
              (Contact admin to change)
            </span>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>

      </form>
    </div>
  )
}