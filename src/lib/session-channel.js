/*
 * Cross-tab session sync (requirement 5).
 * ---------------------------------------------------------------------------
 * One browser is one session, so every tab has to agree about it. When one tab
 * signs out, the others must not sit there showing a dashboard backed by a dead
 * cookie — the next click would 401 and dump the user on the login screen with
 * no explanation.
 *
 * BroadcastChannel is the right primitive: same-origin, instant, and it does
 * NOT deliver a message back to the tab that posted it — so a tab cannot
 * react to its own logout and recurse.
 *
 * FALLBACK. Safari didn't ship BroadcastChannel until 15.4, and it is missing
 * in a few embedded webviews. The fallback is a `storage` event, which fires in
 * OTHER tabs when localStorage changes — same delivery semantics, same
 * same-origin guarantee, just noisier. It writes a timestamped key so two
 * identical events in a row still register as a change (localStorage does not
 * fire `storage` when the value is unchanged).
 *
 * WHAT MAY BE SENT THROUGH HERE: only facts a sibling tab needs to react to.
 * Never tokens. The real credentials are httpOnly cookies the browser shares
 * across tabs on its own — putting a token in a channel message would hand it
 * to any script that can construct the same channel name, throwing away exactly
 * what httpOnly buys.
 */

const CHANNEL_NAME = 'varadhi_session'
const FALLBACK_KEY = 'varadhi_session_event'

export const SESSION_EVENTS = {
  // A tab signed out (or was signed out). Every other tab must clear and go to
  // the login screen.
  LOGOUT: 'logout',
  // A tab successfully refreshed. Cookies are already shared, so this carries
  // no token — it only tells siblings "your 401 was transient, the session is
  // alive" and lets them reset their own refresh scheduling.
  REFRESHED: 'refreshed',
  // The user object changed (role, name, avatar). Requirement: a role change is
  // reflected in every tab immediately rather than on next reload.
  USER_UPDATED: 'user-updated',
  // Someone interacted with the app in some tab. Feeds the inactivity timer so
  // an idle background tab cannot log out an actively-used one.
  ACTIVITY: 'activity',
}

let channel = null

/*
 * "This tab knows it is signed out."
 *
 * Set whenever a logout is published OR received, and read by the login page so
 * it does not ask the server whether a session exists moments after watching
 * one be destroyed. Without it the login page runs its recovery probe against
 * cookies that were just cleared — a guaranteed 401, a pointless refresh
 * attempt, and (before the forceSignOut fix) another logout broadcast.
 *
 * Module-level, so it is per-tab and resets on a full page load. That is the
 * correct lifetime: a genuine reload SHOULD probe, because the user may have a
 * valid session this tab has not learned about yet.
 */
let signedOutLocally = false

export function markSignedOut() {
  signedOutLocally = true
}

export function wasSignedOutLocally() {
  return signedOutLocally
}

// Called on a successful login so a later visit to the login page probes again.
export function clearSignedOutFlag() {
  signedOutLocally = false
}

const getChannel = () => {
  if (typeof window === 'undefined') return null
  if (channel) return channel
  if (typeof BroadcastChannel === 'undefined') return null

  try {
    channel = new BroadcastChannel(CHANNEL_NAME)
  } catch {
    channel = null
  }

  return channel
}

/*
 * Publish an event to every OTHER tab.
 *
 * Never throws. This is called from logout paths and from an axios interceptor;
 * a browser that dislikes structured cloning, or a channel closed during page
 * teardown, must not be able to turn "sign out" into an unhandled exception.
 */
export function publishSessionEvent(type, payload = null) {
  if (typeof window === 'undefined') return

  // The publishing tab never receives its own message, so record the fact here
  // as well as in the subscriber below.
  if (type === SESSION_EVENTS.LOGOUT) markSignedOut()

  const message = { type, payload, at: Date.now() }
  const bc = getChannel()

  if (bc) {
    try {
      bc.postMessage(message)
      return
    } catch {
      /* fall through to the storage fallback */
    }
  }

  try {
    // The value must differ every time or no `storage` event fires. The
    // timestamp inside `message` guarantees that.
    localStorage.setItem(FALLBACK_KEY, JSON.stringify(message))
  } catch {
    /* private mode / quota — sync degrades, the app still works */
  }
}

/*
 * Subscribe to events from other tabs. Returns an unsubscribe function, which
 * callers MUST invoke on unmount — a leaked BroadcastChannel keeps a closed
 * React tree alive and its handler firing.
 *
 * Both transports are wired at once rather than picking one: if BroadcastChannel
 * exists we use it, but subscribing to `storage` too costs nothing and covers
 * the case where one tab fell back and another did not.
 */
export function subscribeToSessionEvents(handler) {
  if (typeof window === 'undefined') return () => {}

  const bc = getChannel()

  // Recorded centrally rather than in each subscriber, so every consumer of the
  // channel agrees about whether this tab has seen a logout.
  const dispatch = (data) => {
    if (!data || typeof data.type !== 'string') return
    if (data.type === SESSION_EVENTS.LOGOUT) markSignedOut()
    handler(data)
  }

  const onMessage = (event) => dispatch(event?.data)

  const onStorage = (event) => {
    if (event.key !== FALLBACK_KEY || !event.newValue) return
    try {
      dispatch(JSON.parse(event.newValue))
    } catch {
      /* malformed — ignore */
    }
  }

  bc?.addEventListener('message', onMessage)
  window.addEventListener('storage', onStorage)

  return () => {
    bc?.removeEventListener('message', onMessage)
    window.removeEventListener('storage', onStorage)
  }
}

/*
 * Closed on full teardown only. The channel is module-level and shared by every
 * subscriber in the tab, so an individual component unmounting must NOT close
 * it — that would silently deafen every other listener in the same tab.
 */
export function closeSessionChannel() {
  try {
    channel?.close()
  } catch {
    /* already closed */
  }
  channel = null
}
