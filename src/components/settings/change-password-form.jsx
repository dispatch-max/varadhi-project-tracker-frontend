'use client'

import { useState } from 'react'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import apiClient from '@/lib/api-client'

export function ChangePasswordForm() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errors, setErrors] = useState({})

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
    setIsSuccess(false)
  }

  function toggleShow(field) {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] })
  }

  function validate() {
    const newErrors = {}
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required.'
    }
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required.'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters.'
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password.'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.'
    }
    if (
      formData.currentPassword &&
      formData.newPassword &&
      formData.currentPassword === formData.newPassword
    ) {
      newErrors.newPassword =
        'New password must be different from current password.'
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
      await apiClient.put('/auth/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      })
      setIsSuccess(true)
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (err) {
      setErrors({
        general:
          err.response?.data?.message ||
          'Failed to change password. Try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Password field helper
  function PasswordInput({ id, name, placeholder, showField }) {
    return (
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={showPasswords[showField] ? 'text' : 'password'}
          placeholder={placeholder}
          value={formData[name]}
          onChange={handleChange}
          disabled={isLoading}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => toggleShow(showField)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-muted-foreground"
        >
          {showPasswords[showField]
            ? <EyeOff className="w-4 h-4" />
            : <Eye className="w-4 h-4" />
          }
        </button>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <h3 className="text-sm font-semibold text-foreground mb-5">
        Change Password
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Success */}
        {isSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            Password changed successfully!
          </div>
        )}

        {/* General Error */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
            {errors.general}
          </div>
        )}

        {/* Current Password */}
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Current Password</Label>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            placeholder="Enter current password"
            showField="current"
          />
          {errors.currentPassword && (
            <p className="text-red-500 text-xs">{errors.currentPassword}</p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <Label htmlFor="newPassword">New Password</Label>
          <PasswordInput
            id="newPassword"
            name="newPassword"
            placeholder="Min. 6 characters"
            showField="new"
          />
          {errors.newPassword && (
            <p className="text-red-500 text-xs">{errors.newPassword}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Re-enter new password"
            showField="confirm"
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs">{errors.confirmPassword}</p>
          )}
        </div>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            className="bg-violet-600 hover:bg-violet-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Updating...</>
            ) : (
              'Update Password'
            )}
          </Button>
        </div>

      </form>
    </div>
  )
}