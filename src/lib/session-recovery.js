import axios from 'axios'

/*
 * Silent session recovery.
 * ---------------------------------------------------------------------------
 * WHY THIS EXISTS
 *
 * Next.js middleware runs on the Vercel origin and cannot read cookies set by
 * the API on Render — so the route gate gets its answer from a first-party hint
 * cookie instead. Any user whose hint cookie is missing gets redirected to
 * /auth/login even when their httpOnly session is perfectly alive. That happens
 * to every existing user right after the migration, because the OLD hint cookie
 * held the access token and expired after 15 minutes.
 *
 * Showing a password prompt to someone who is still logged in is the single
 * most visible way this migration could go wrong. So before rendering the login
 * form, ask the server whether the browser already has a valid session and, if
 * it does, put the user back where they were.
 *
 * WHY IT USES RAW AXIOS AND NOT apiClient
 *
 * apiClient's response interceptor calls forceSignOut() on a 401, which
 * hard-navigates to /auth/login. Running that FROM the login page is an
 * infinite redirect loop. This module therefore talks to the API directly: no
 * interceptors, no redirects, no shared refresh queue. A failure here means
 * exactly one thing — show the login form — and must never navigate anywhere.
 *
 * It still sends credentials and the CSRF header, because it is making the same
 * authenticated calls the real client would.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

// Longer than the client default: on Render's free tier this is often the
// request that wakes a cold container, and a timeout here would show the login
// form to someone who is actually signed in.
const PROBE_TIMEOUT = 30000

const rawRequest = (method, path) =>
  axios({
    method,
    url: `${BASE}${path}`,
    withCredentials: true,
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    timeout: PROBE_TIMEOUT,
    // Never throw on a status — every outcome here is a normal answer, and an
    // exception would be indistinguishable from a network failure.
    validateStatus: () => true,
  })

/*
 * Single-flight, for the same reason api-client's refresh is.
 *
 * StrictMode mounts effects twice in development, and a remount (a sibling tab
 * broadcasting a logout re-navigates the login page) starts another probe while
 * the first is still open. Two probes can each attempt a refresh, and with token
 * rotation the loser of that race gets a replayed token. Sharing one promise
 * means every caller observes the same outcome from one round trip.
 *
 * Cleared in `finally` so a settled probe never pins a stale answer — a later
 * mount, after a real login, gets a fresh look at the session.
 */
let inFlightProbe = null

/*
 * Returns the user object if this browser still has a usable session, else null.
 *
 * Handles the ordinary case where the 15-minute access token has expired but the
 * 7-day refresh token has not: that is precisely the state a returning user is
 * in, and it is recoverable in one extra round trip.
 *
 * ALWAYS settles, and never throws — the caller uses it to decide whether to
 * show a password prompt, so a hang here is a permanently stuck spinner.
 */
export function probeSession() {
  if (inFlightProbe) return inFlightProbe

  inFlightProbe = runProbe().finally(() => {
    inFlightProbe = null
  })

  return inFlightProbe
}

async function runProbe() {
  try {
    let me = await rawRequest('get', '/auth/me')

    if (me.status === 200) {
      return me.data?.data || null
    }

    // TOKEN_EXPIRED and NO_TOKEN are both recoverable: the access cookie is
    // either lapsed or already deleted by the browser, while the 7-day refresh
    // cookie may still be perfectly good. This is the ordinary state of a user
    // returning the next morning, so it must not go straight to a login form.
    // SESSION_REVOKED, TOKEN_REUSE and TOKEN_INVALID are terminal — the refresh
    // token is dead too, and retrying is a slower way to show the same form.
    const recoverable = me.data?.code === 'TOKEN_EXPIRED' || me.data?.code === 'NO_TOKEN'
    if (me.status !== 401 || !recoverable) {
      return null
    }

    const refreshed = await rawRequest('post', '/auth/refresh')
    if (refreshed.status !== 200) return null

    // The refresh response already carries the user, so prefer it and skip a
    // third round trip. Falling back to /auth/me keeps this correct if that
    // payload ever changes shape.
    const userFromRefresh = refreshed.data?.data?.user
    if (userFromRefresh) return userFromRefresh

    me = await rawRequest('get', '/auth/me')
    return me.status === 200 ? me.data?.data || null : null
  } catch {
    // Offline, DNS failure, CORS problem. Not evidence of being signed out —
    // but with no way to confirm a session, the login form is the safe answer.
    return null
  }
}
