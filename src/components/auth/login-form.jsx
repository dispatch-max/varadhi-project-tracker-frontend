'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/lib/api/auth.api'
import { clearOfflineCaches } from '@/lib/offline-cache'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.')
      return
    }

    setIsLoading(true)
    try {
      const { user, token } = await authApi.login(formData)

      // Discard any service-worker cache left by a previous session BEFORE
      // navigating. This is the real cross-user-leak guarantee: logout clears
      // caches too, but a browser killed mid-session never runs that path, so
      // a successful login is the first moment we can be certain a different
      // person may be about to read the previous user's cached API responses.
      //
      // Awaited deliberately — caches.delete() is async, and if router.push
      // won the race the dashboard could paint from the old user's cache. The
      // catch keeps a storage failure from ever blocking a valid login;
      // clearOfflineCaches already swallows its own errors, so this is belt
      // and braces.
      await clearOfflineCaches().catch(() => {})

      // Save to Zustand store + localStorage
      setAuth(user, token)

      // Save token in cookie for middleware
      document.cookie = `varadhi_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`

      // Redirect based on role
      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      // No `response` means the request never reached the server — offline, DNS
      // failure, or the API is down. Falling through to the credentials message
      // would tell an offline user their correct password is wrong, and they'd
      // retype it indefinitely.
      if (!err.response) {
        setError(
          "Can't reach the server. Check your connection and try again."
        )
      } else {
        setError(
          err.response?.data?.message ||
          'Invalid email or password. Try again.'
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@varadhi.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isLoading}
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link
            href="/auth/forgot-password"
            className="text-xs text-violet-600 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            disabled={isLoading}
            autoComplete="current-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-muted-foreground"
          >
            {showPassword
              ? <EyeOff className="w-4 h-4" />
              : <Eye className="w-4 h-4" />
            }
          </button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-violet-600 hover:bg-violet-700"
        disabled={isLoading}
      >
        {isLoading
          ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in...</>
          : 'Sign in'
        }
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/auth/register"
          className="text-violet-600 font-medium hover:underline"
        >
          Contact your admin
        </Link>
      </p>

    </form>
  )
}

