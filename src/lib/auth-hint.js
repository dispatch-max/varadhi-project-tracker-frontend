/*
 * The route-gate hint cookie.
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS AT ALL
 *
 * Next.js middleware (proxy.js) runs on the Vercel origin. The real auth
 * cookies are set by the API on the Render origin, and a cookie set by one
 * registrable domain is never sent to another — so the middleware structurally
 * CANNOT see varadhi_access or varadhi_refresh, httpOnly or not. It needs some
 * first-party signal to decide whether to show the login page.
 *
 * WHAT IT REPLACES, AND WHY THAT WAS A BUG
 *
 * The previous code wrote the actual access token into a JS-readable cookie:
 *
 *     document.cookie = `varadhi_token=${token}; ...; max-age=900`
 *
 * That defeated the entire point of httpOnly — the credential was back in
 * reach of any XSS on the page — and it expired after 15 minutes, so the
 * middleware bounced people to the login screen every quarter hour even though
 * their refresh token was good for another week.
 *
 * This cookie carries NO token and NO user data. It is the literal string "1".
 * It says "this browser believes it has a session", nothing more.
 *
 * IT IS A HINT, NOT A SECURITY CONTROL. Anyone can set it with one line in a
 * console; all that buys them is the client-side shell of a page whose every
 * API call still 401s. Authorisation lives entirely in the backend's `protect`
 * middleware. Do not add a role to this cookie and gate anything on it.
 */

const HINT_COOKIE = 'varadhi_token'

/*
 * Shared timestamp behind the inactivity timer.
 *
 * Declared here rather than in the hook that writes it because it is
 * session-scoped state: it is only meaningful while someone is signed in, and
 * it must be torn down by the same cleanup that clears the cached user. Leaving
 * a stale "last active" behind means the next person to sign in on this device
 * inherits the previous user's idle clock.
 *
 * use-inactivity-timeout.js imports it from here so the key exists in exactly
 * one place and the cleanup cannot drift from the writer.
 */
export const LAST_ACTIVITY_KEY = 'varadhi_last_activity'

// Matches the refresh token / session lifetime. Anything shorter re-introduces
// the "logged out every 15 minutes" bug; anything longer just means one wasted
// redirect through /auth/login after the session has genuinely expired.
const HINT_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

/*
 * SameSite=Lax is correct HERE even though the auth cookies must use None.
 * This cookie is first-party to the frontend origin and is only ever read by
 * Next middleware handling a top-level navigation — which Lax permits. It is
 * never sent cross-site, so it does not need (and should not have) None.
 *
 * Secure is set only on HTTPS so local development over http://localhost still
 * works; a Secure cookie is silently dropped on a plain-HTTP origin.
 */
export function setAuthHint() {
  if (typeof document === 'undefined') return

  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${HINT_COOKIE}=1; Path=/; Max-Age=${HINT_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
}

/*
 * Clearing must use the same Path the cookie was set with, or the browser
 * treats it as a different cookie and the original survives — leaving the
 * middleware convinced the user is still signed in.
 */
export function clearAuthHint() {
  if (typeof document === 'undefined') return

  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
}

export function hasAuthHint() {
  if (typeof document === 'undefined') return false
  return document.cookie
    .split(';')
    .some((part) => part.trim().startsWith(`${HINT_COOKIE}=1`))
}

const readCookie = (name) => {
  if (typeof document === 'undefined') return null
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
  return match ? match.slice(name.length + 1) : null
}

/*
 * Purge pre-migration credentials from JavaScript-readable browser storage.
 * ---------------------------------------------------------------------------
 * THIS IS THE ACTUAL POINT OF THE MIGRATION, not cleanup around it.
 *
 * The whole reason for moving to httpOnly cookies is that a token reachable from
 * JavaScript is a token any XSS can steal. Shipping the new cookies while
 * leaving the old ones in place would mean the vulnerable copies sit in every
 * existing user's browser for up to 7 more days — the new system would be
 * secure and the users would not be.
 *
 * THREE legacy stores held a real JWT, across two earlier iterations:
 *
 *   localStorage.varadhi_token            the ORIGINAL design — the access
 *                                         token in plain text, shared across
 *                                         every tab and surviving restarts.
 *                                         This is the one the migration was
 *                                         commissioned to eliminate.
 *   sessionStorage.varadhi_access_token   the later per-tab attempt.
 *   document.cookie varadhi_token=<jwt>   the access token again, as a
 *                                         NON-httpOnly cookie readable by any
 *                                         script on the page.
 *
 * All three are removed here on first load after the upgrade. Missing any one
 * of them leaves a working credential sitting in reach of an XSS for up to a
 * week, which would defeat the entire point of moving to httpOnly cookies.
 *
 * NOTE the collision: `varadhi_token` is a legacy JWT in localStorage but the
 * legitimate value-less hint in document.cookie. They are different stores with
 * the same key name — the localStorage one is always deleted, the cookie one is
 * overwritten with "1" so the route gate keeps working.
 *
 * Returns what it found, so the caller can tell that a legacy session existed
 * and is worth trying to recover.
 */

// Keys that ever held token material. localStorage.varadhi_user is NOT here —
// that is the current cached-profile key and must survive.
const LEGACY_TOKEN_KEYS = [
  'varadhi_token',
  'varadhi_access_token',
  'varadhi_refresh_token',
  'varadhi_session_id',
]

export function purgeLegacyBrowserAuth() {
  if (typeof window === 'undefined') {
    return { hadLegacyToken: false, legacyUser: null }
  }

  let hadLegacyToken = false
  let legacyUser = null

  // 1. The non-httpOnly cookie. Any value other than "1" is a legacy JWT.
  const hintValue = readCookie(HINT_COOKIE)
  if (hintValue && hintValue !== '1') {
    hadLegacyToken = true
    // Overwrite in place — same name and path, so this replaces the JWT rather
    // than adding a second cookie. Done before anything async can run.
    setAuthHint()
  }

  // 2. Token material in BOTH web storages. localStorage is the important one:
  //    it is where the original implementation kept the JWT, and unlike
  //    sessionStorage it survives closing the browser.
  try {
    for (const key of LEGACY_TOKEN_KEYS) {
      if (localStorage.getItem(key)) hadLegacyToken = true
      localStorage.removeItem(key)

      if (sessionStorage.getItem(key)) hadLegacyToken = true
      sessionStorage.removeItem(key)
    }
  } catch {
    /* storage unavailable (private mode) — nothing to purge */
  }

  // 3. The per-tab cached user from the sessionStorage iteration. Handed back
  //    so a migrating user's UI does not blank out for one render.
  try {
    const rawUser = sessionStorage.getItem('varadhi_user')
    if (rawUser) {
      try {
        legacyUser = JSON.parse(rawUser)
      } catch {
        /* unparseable — discard it anyway */
      }
    }
    sessionStorage.removeItem('varadhi_user')
  } catch {
    /* storage unavailable */
  }

  return { hadLegacyToken, legacyUser }
}

export { HINT_COOKIE }
