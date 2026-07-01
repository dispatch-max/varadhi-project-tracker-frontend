'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, CheckCircle } from 'lucide-react'
import { authApi } from '@/lib/api/auth.api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setIsLoading(true)
    try {
      await authApi.forgotPassword(email)
      setIsSuccess(true)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Something went wrong. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100">
          <CheckCircle className="w-7 h-7 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">
          Check your email
        </h2>
        <p className="text-sm text-slate-500">
          We sent a password reset link to{' '}
          <span className="font-medium text-slate-700">{email}</span>
        </p>
        <Link
          href="/auth/login"
          className="block text-sm text-violet-600 font-medium hover:underline mt-2"
        >
          Back to Sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@varadhi.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setError('')
          }}
          disabled={isLoading}
          autoComplete="email"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full bg-violet-600 hover:bg-violet-700"
        disabled={isLoading}
      >
        {isLoading
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
          : 'Send Reset Link'
        }
      </Button>

      {/* Back to login */}
      <p className="text-center text-sm text-slate-500">
        Remember your password?{' '}
        <Link
          href="/auth/login"
          className="text-violet-600 font-medium hover:underline"
        >
          Back to Sign in
        </Link>
      </p>

    </form>
  )
}