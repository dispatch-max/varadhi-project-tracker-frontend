'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/lib/api/auth.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function AcceptInviteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuth } = useAuthStore()

  const token = searchParams.get('token')

  // Invite verification state
  const [verifying, setVerifying] = useState(true)
  const [invite, setInvite] = useState(null) // { email, role }
  const [verifyError, setVerifyError] = useState('')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Verify the token on mount
  useEffect(() => {
    let active = true
    async function verify() {
      if (!token) {
        if (active) { setVerifyError('No invite token provided.'); setVerifying(false) }
        return
      }
      try {
        const data = await authApi.verifyInvite(token)
        if (active) {
          setInvite(data)
          // Prefill name from the email local-part as a starting point
          if (data?.email) {
            setFormData((prev) => ({ ...prev, name: data.email.split('@')[0] }))
          }
        }
      } catch (err) {
        if (active) {
          setVerifyError(
            err?.response?.data?.message ||
            'This invite link is invalid or has expired.'
          )
        }
      } finally {
        if (active) setVerifying(false)
      }
    }
    verify()
    return () => { active = false }
  }, [token])

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  function validate() {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required.'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required.'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.'
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.'
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
      const { user, token: jwt } = await authApi.acceptInvite({
        token,
        name: formData.name,
        password: formData.password,
      })

      // Auto-login: store auth + cookie, same as register/login flows
      setAuth(user, jwt)
      document.cookie = `varadhi_token=${jwt}; path=/; max-age=${7 * 24 * 60 * 60}`

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      setErrors({
        general:
          err?.response?.data?.message ||
          'Failed to accept the invitation. Please try again.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Verifying state ──────────────────────────────────────────────────────
  if (verifying) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-500">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Verifying your invite…
      </div>
    )
  }

  // ─── Invalid token state ──────────────────────────────────────────────────
  if (verifyError) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {verifyError}
        </div>
        <p className="text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-violet-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    )
  }

  // ─── Valid invite — show the set-up form ──────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Invited-as banner */}
      <div className="bg-violet-50 border border-violet-100 rounded-lg px-4 py-3 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-violet-500 flex-shrink-0" />
        <p className="text-xs text-violet-700">
          You&apos;re joining as <span className="font-medium">{invite?.email}</span>
          {invite?.role ? <> · <span className="capitalize font-medium">{invite.role}</span></> : null}
        </p>
      </div>

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
          type="text"
          placeholder="Your name"
          value={formData.name}
          onChange={handleChange}
          disabled={isLoading}
          autoComplete="name"
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Min. 6 characters"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>

      {/* Confirm Password */}
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type={showConfirm ? 'text' : 'password'}
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full bg-violet-600 hover:bg-violet-700"
        disabled={isLoading}
      >
        {isLoading
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining…</>
          : 'Join the team'}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-violet-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>

    </form>
  )
}