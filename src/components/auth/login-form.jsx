'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/lib/api/auth.api'
import { clearOfflineCaches } from '@/lib/offline-cache'
import { purgeLegacyBrowserAuth } from '@/lib/auth-hint'
import { probeSession } from '@/lib/session-recovery'
import { wasSignedOutLocally, clearSignedOutFlag } from '@/lib/session-channel'
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

  /*
   * Silent session recovery — runs before the form is shown.
   *
   * Existing users arrive here for a reason that has nothing to do with being
   * signed out: the pre-migration hint cookie held the access token and lapsed
   * after 15 minutes, so Next middleware redirected them even though their
   * httpOnly session is alive for another 7 days. Asking them for a password
   * would be the migration visibly failing.
   *
   * Start in the checking state ONLY when a probe could plausibly succeed. If
   * this tab already watched a logout happen, there is nothing to check and the
   * form renders immediately — no spinner, no request.
   */
  const [checking, setChecking] = useState(() => !wasSignedOutLocally())

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      // Do this FIRST and synchronously. The legacy `varadhi_token` value holds
      // a real JWT readable by any script — the exact exposure this migration
      // exists to close — so it is purged before any await, not after.
      purgeLegacyBrowserAuth()

      /*
       * Don't interrogate the server about a session we just watched die.
       *
       * After a logout — in this tab or a sibling's, via BroadcastChannel — the
       * cookies are gone and the session row is revoked. Probing would be a
       * guaranteed 401 followed by a pointless refresh attempt. Skipping it is
       * both faster and the thing that keeps a logout from re-entering the
       * recovery path at all.
       */
      if (wasSignedOutLocally()) {
        if (!cancelled) setChecking(false)
        return
      }

      let user = null
      try {
        user = await probeSession()
      } finally {
        /*
         * DETERMINISTIC EXIT — the fix for the stuck spinner.
         *
         * This used to sit behind `if (cancelled) return`, which meant a
         * cancelled effect never cleared `checking`. Combined with a
         * mount-once ref guard, a remount would not start a replacement probe
         * either, so the component could sit on "Checking your session..."
         * forever. Now the state is always cleared, on every path — success,
         * 401, refresh failure, network error — and `cancelled` only prevents
         * setting state on an unmounted component.
         */
        if (!cancelled) setChecking(false)
      }

      if (cancelled || !user) return

      // Still signed in. Restore the store and hint cookie, then continue to
      // the app instead of showing a password prompt.
      setAuth(user)
      router.replace('/dashboard')
    })()

    return () => {
      cancelled = true
    }
  }, [router, setAuth])

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
  const { user } = await authApi.login(formData)

  // Drop any cached responses belonging to whoever used this browser last —
  // otherwise the new user can briefly see the previous user's data from the
  // service worker cache.
  await clearOfflineCaches().catch(() => {})

  // Stores the user object in localStorage (shared by every tab) and sets the
  // route-gate hint cookie. No token is involved: login already set httpOnly
  // access and refresh cookies that JavaScript cannot read.
  setAuth(user)

  // This tab is signed in again, so a later visit to the login page should
  // probe normally rather than skipping straight to the form.
  clearSignedOutFlag()

  router.push('/dashboard')
  router.refresh()
} catch (err) {
  if (!err.response) {
    setError("Can't reach the server. Check your connection and try again.")
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

  // Session probe still in flight. Showing the password fields here and then
  // yanking them away on a successful recovery is worse than a brief, honest
  // wait — and it would invite someone to start typing a password they do not
  // need to enter.
  if (checking) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-12"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
        <p className="text-sm text-muted-foreground">Checking your session...</p>
      </div>
    )
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

