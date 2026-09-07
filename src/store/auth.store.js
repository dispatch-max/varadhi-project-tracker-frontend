import { create } from 'zustand'
import { getFromStorage, saveToStorage, removeFromStorage } from '@/utils'
import { setAuthHint, clearAuthHint, LAST_ACTIVITY_KEY } from '@/lib/auth-hint'

/*
 * Auth store — one session per browser, shared by every tab.
 * ---------------------------------------------------------------------------
 * REVERSED FROM THE PREVIOUS VERSION, DELIBERATELY.
 *
 * This store used to keep everything in sessionStorage, commented as "per-tab
 * isolation — different users possible". sessionStorage is scoped to a single
 * tab and destroyed when the browser closes, which produced exactly the
 * opposite of the required behaviour:
 *
 *   opening a new tab       →  appeared signed out   (should stay signed in)
 *   closing the browser     →  signed out            (should persist 7 days)
 *
 * It is localStorage now, which is shared across tabs and survives a restart —
 * matching the httpOnly cookies, which the browser has always shared this way.
 * The old design was fighting the cookies rather than reflecting them.
 *
 * Multi-user testing uses separate Chrome profiles or incognito windows, which
 * isolate cookies AND localStorage properly. That is the supported approach;
 * two accounts in two tabs of one profile is not, and never really was — the
 * cookies were always shared even when this store pretended otherwise.
 *
 * NO TOKEN IS STORED HERE. Not in localStorage, not in memory. The access and
 * refresh tokens are httpOnly cookies that JavaScript cannot read, which is the
 * entire point. What lives here is the user OBJECT — name, role, avatar — so
 * the UI can render without waiting on /auth/me. It is a cache of public
 * profile data, not a credential.
 *
 * Treat `user.role` here as presentation only. The sidebar filters nav items by
 * it, but anyone can edit localStorage; every real authorisation decision is
 * made by the backend's restrictTo middleware.
 */

const USER_KEY = 'varadhi_user'

export const useAuthStore = create((set, get) => ({
  // Initialised empty on purpose, NOT from storage.
  //
  // Reading localStorage during module evaluation runs on the server too (where
  // it is undefined) and then differently on the client, which is a React
  // hydration mismatch — the server sends markup for a signed-out user and the
  // client immediately renders a signed-in one. `hydrate()` fills this in after
  // mount instead, when a mismatch is impossible.
  user: null,
  isAuthenticated: false,
  isLoading: false,
  // False until hydrate() has run once. Components use it to hold off on
  // "you are signed out" UI during the first paint, when we genuinely do not
  // know yet.
  isHydrated: false,

  /*
   * Called after a successful login / register / accept-invite.
   *
   * Takes only a user. Earlier call sites passed (user, token, sessionId);
   * there is no token to pass any more, and the session id belongs to the
   * server. Extra arguments are ignored rather than stored.
   */
  setAuth: (user) => {
    saveToStorage(USER_KEY, user)
    // Lets Next middleware (proxy.js) allow the navigation. Carries no token —
    // see lib/auth-hint.js for why it exists and why it is only a hint.
    setAuthHint()
    set({ user, isAuthenticated: true, isHydrated: true })
  },

  /*
   * Update the cached user without touching session state — profile edits, and
   * role changes arriving from a sibling tab or a refresh response.
   *
   * Merges rather than replaces so a partial update (just an avatar, say)
   * cannot blank out the rest of the object.
   */
  setUser: (partial) => {
    const current = get().user
    if (!current) return
    const next = { ...current, ...partial }
    saveToStorage(USER_KEY, next)
    set({ user: next })
  },

  /*
   * Restore from localStorage on mount. Safe to call repeatedly.
   *
   * The presence of a user object is NOT proof of a live session — the cookies
   * may have expired while the browser was closed. It is an optimistic render;
   * the first API call settles the question, and a 401 there triggers
   * forceSignOut in api-client.js.
   */
  hydrate: (legacyUser = null) => {
    if (typeof window === 'undefined') return

    // `legacyUser` is the cached user recovered from the pre-migration
    // sessionStorage key. Falling back to it means an existing user's first load
    // after the upgrade renders their name and role immediately instead of
    // blanking until the server confirms them. It is adopted into localStorage
    // by setAuth below, so this fallback is used exactly once per browser.
    const user = getFromStorage(USER_KEY) || legacyUser

    if (user) {
      // Persist a migrated legacy user so the next load reads it from the
      // normal key and this path is never taken again.
      saveToStorage(USER_KEY, user)
      // Re-assert the hint cookie. Its 7-day max-age can outlive a browser
      // session, but if it was cleared (or the user arrived from a machine
      // where it expired) the middleware would bounce an otherwise valid
      // session to the login page.
      setAuthHint()
      set({ user, isAuthenticated: true, isHydrated: true })
    } else {
      set({ user: null, isAuthenticated: false, isHydrated: true })
    }
  },

  /*
   * Clear local auth state. Does NOT call the API and does NOT redirect —
   * callers decide those. Used both by an intentional logout and when reacting
   * to another tab's logout broadcast.
   *
   * Cookies are httpOnly and cross-origin, so this cannot remove them; only the
   * backend's Set-Cookie on /auth/logout can. That is why logout must call the
   * API rather than only clearing state here.
   */
  /*
   * THE single client-side auth teardown. Every terminal path calls this —
   * an intentional logout, a sibling tab's logout broadcast, the inactivity
   * timeout, and a failed/revoked session in api-client's forceSignOut.
   *
   * It used to have a rival: forceSignOut cleared only the hint cookie, so a
   * session that died server-side (both cookies gone, refresh refused) left
   * `varadhi_user` sitting in localStorage. The user was correctly redirected
   * to the login page, but the previous user's name and role stayed on the
   * device. Two cleanup implementations meant one of them was always going to
   * be the incomplete one — so there is now only this.
   *
   * Removes every localStorage key scoped to a signed-in session, plus the
   * route-gate hint cookie.
   */
  clearAuth: () => {
    removeFromStorage(USER_KEY)
    // Session-scoped: the next person to sign in on this device must not
    // inherit the previous user's idle clock.
    removeFromStorage(LAST_ACTIVITY_KEY)
    clearAuthHint()
    set({ user: null, isAuthenticated: false, isHydrated: true })
  },

  setLoading: (isLoading) => set({ isLoading }),
}))
