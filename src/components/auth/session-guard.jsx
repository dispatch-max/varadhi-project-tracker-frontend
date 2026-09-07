'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/lib/api/auth.api'
import { forceSignOut } from '@/lib/api-client'
import {
  subscribeToSessionEvents,
  publishSessionEvent,
  SESSION_EVENTS,
} from '@/lib/session-channel'
import { purgeLegacyBrowserAuth } from '@/lib/auth-hint'
import { useInactivityTimeout } from '@/hooks/use-inactivity-timeout'
import { InactivityWarningModal } from '@/components/auth/inactivity-warning-modal'

/*
 * Session lifecycle for the whole app. Renders nothing but the idle modal.
 *
 * Three jobs:
 *   1. Hydrate the auth store from localStorage after mount.
 *   2. Keep every tab in agreement (requirement 5).
 *   3. Run the inactivity clock (requirement 6).
 *
 * Mounted in providers.jsx so it also covers the auth routes — hydration has to
 * happen there too, or a signed-in user landing on /auth/login renders as
 * signed out for a frame.
 *
 * ON SILENT REFRESH (requirement 3): there is no timer here for it, on purpose.
 * Refresh is reactive — api-client catches a 401 with TOKEN_EXPIRED, refreshes
 * once through a single-flight queue, and retries the original request. The
 * user never sees it. A second, proactive refresh timer in this component would
 * be a competing source of refreshes racing the interceptor's, and with token
 * rotation a lost race is a signed-out user. One refresh path is the safe
 * number. A tab sitting idle with no requests has nothing to refresh FOR; the
 * moment it makes a request, the interceptor handles it.
 */

// The idle timer must not run where there is no session to protect.
const PUBLIC_PREFIXES = ['/auth', '/offline']

export function SessionGuard() {
  const router = useRouter()
  const pathname = usePathname()

  const { isAuthenticated, isHydrated, hydrate, clearAuth, setUser } =
    useAuthStore()

  // Prevents a double sign-out when, say, the idle timeout and a broadcast
  // arrive together.
  const [isEnding, setIsEnding] = useState(false)

  const isPublicRoute = PUBLIC_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  )

  /*
   * 1. Purge pre-migration credentials, then restore the cached user.
   *
   * The purge runs on every route, not just the login page, because an existing
   * user's first load after the upgrade may land anywhere — and until it runs,
   * their access token is still sitting in sessionStorage and in a
   * JavaScript-readable cookie. That exposure is the whole reason for this
   * migration, so it is closed on first paint rather than left to expire.
   *
   * It returns the user object the old build cached in sessionStorage, which is
   * handed to the store so a migrating user's UI does not blank out for the one
   * render before the server confirms them.
   */
  useEffect(() => {
    const { legacyUser } = purgeLegacyBrowserAuth()
    hydrate(legacyUser)
  }, [hydrate])

  /*
   * 2. React to sibling tabs.
   *
   * The LOGOUT branch must NOT call the API or re-broadcast: the tab that
   * originated the logout already revoked the session server-side, and
   * re-broadcasting would ping-pong the event around every open tab forever.
   */
  useEffect(() => {
    return subscribeToSessionEvents((event) => {
      if (event.type === SESSION_EVENTS.LOGOUT) {
        clearAuth()
        if (!isPublicRoute) router.replace('/auth/login')
        return
      }

      // Role or profile changed elsewhere — reflect it immediately rather than
      // on next reload, so a demoted user stops seeing admin nav at once.
      if (event.type === SESSION_EVENTS.USER_UPDATED && event.payload?.user) {
        setUser(event.payload.user)
      }
    })
  }, [clearAuth, setUser, router, isPublicRoute])

  /*
   * 3a. End the session from this tab: revoke server-side, then clear
   * everywhere. forceSignOut broadcasts the logout, wipes cached responses and
   * the outbox, and hard-navigates to the login page.
   */
  const endSession = useCallback(async () => {
    if (isEnding) return
    setIsEnding(true)

    try {
      await authApi.logout()
    } catch {
      // Network failure, or the session was already dead server-side. Either
      // way this browser is signing out — never leave the user on a page that
      // looks authenticated because a cleanup call failed.
    }

    clearAuth()
    await forceSignOut()
  }, [isEnding, clearAuth])

  // 3b. The idle clock. Disabled on public routes and until hydration settles,
  // so it can never run against a user we have not confirmed yet.
  const { isWarning, secondsRemaining, stayLoggedIn } = useInactivityTimeout({
    enabled: isHydrated && isAuthenticated && !isPublicRoute,
    onTimeout: endSession,
  })

  /*
   * "Stay logged in" resets the shared activity clock in every tab. It also
   * pokes the API so the session's last_active_at is refreshed server-side and
   * the Active Sessions list does not show this device as idle for 30 minutes —
   * and, usefully, a 401 here surfaces a session that died while the user was
   * away, sending them to the login screen instead of a dead dashboard.
   */
  const handleStayLoggedIn = useCallback(() => {
    stayLoggedIn()
    authApi.getMe().catch(() => {
      /* api-client's interceptor handles a real 401 */
    })
  }, [stayLoggedIn])

  if (!isWarning) return null

  return (
    <InactivityWarningModal
      open={isWarning}
      secondsRemaining={secondsRemaining}
      onStayLoggedIn={handleStayLoggedIn}
      onLogoutNow={endSession}
    />
  )
}

/*
 * Broadcast a user change to sibling tabs. Call after any mutation that changes
 * the user object — a profile save, or an admin changing someone's role.
 */
export function broadcastUserUpdate(user) {
  publishSessionEvent(SESSION_EVENTS.USER_UPDATED, { user })
}
