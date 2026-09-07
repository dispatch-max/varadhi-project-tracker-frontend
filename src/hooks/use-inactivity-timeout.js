'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  publishSessionEvent,
  subscribeToSessionEvents,
  SESSION_EVENTS,
} from '@/lib/session-channel'
import { LAST_ACTIVITY_KEY } from '@/lib/auth-hint'

/*
 * Inactivity timeout (requirement 6).
 * ---------------------------------------------------------------------------
 * 30 minutes idle → warning modal → 5 more minutes → automatic sign-out.
 *
 * THE HARD PART IS CROSS-TAB, NOT THE TIMER.
 *
 * "Activity" is per-tab: a mousemove in tab A fires no event in tab B. A naive
 * per-tab timer therefore signs the user out of a background tab after 30
 * minutes even while they are actively typing in the foreground one — and
 * because the session is shared, that logout ends the session everywhere. The
 * user gets thrown out mid-sentence.
 *
 * So last-activity is shared browser-wide through localStorage. Every tab
 * writes its own activity there (throttled) and every tab reads the shared
 * value, so the timer measures "nobody has touched this app anywhere", which is
 * what the requirement actually means.
 *
 * WHY POLLING, NOT setTimeout. A single 30-minute setTimeout is wrong twice
 * over: it must be torn down and rebuilt on every mousemove, and background
 * tabs have their timers throttled (and a sleeping laptop stops them entirely),
 * so it would fire late or never. A short interval comparing wall-clock
 * timestamps is immune to both — after a laptop wakes from sleep the very next
 * tick sees the true elapsed time and acts immediately.
 */

const IDLE_LIMIT_MS = 30 * 60 * 1000 // 30 min → warning
const WARNING_MS = 5 * 60 * 1000 //  5 min → sign-out
const CHECK_INTERVAL_MS = 15 * 1000 // resolution of the countdown

// Writing to localStorage on every mousemove would be hundreds of writes a
// second. One write per 20s is plenty when the threshold is 30 minutes.
const ACTIVITY_WRITE_THROTTLE_MS = 20 * 1000

// Imported, not declared: auth.store's clearAuth() must remove this key on
// sign-out, and a second copy of the string here would let the writer and the
// cleanup drift apart silently.


// `passive` tells the browser these listeners never call preventDefault, so
// scrolling is not blocked waiting on them. mousemove/scroll fire constantly —
// this matters for smoothness.
const ACTIVITY_EVENTS = [
  'mousemove',
  'mousedown',
  'click',
  'keydown',
  'scroll',
  'touchstart',
  'wheel',
]

const now = () => Date.now()

const readSharedActivity = () => {
  try {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY)
    const parsed = raw ? Number(raw) : 0
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

const writeSharedActivity = (timestamp) => {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(timestamp))
  } catch {
    /* private mode / quota — falls back to this tab's in-memory value */
  }
}

/*
 * @param enabled  false on public routes and before hydration — an idle timer
 *                 must never run on the login page.
 * @param onTimeout called once when the grace period expires.
 *
 * Returns { isWarning, secondsRemaining, stayLoggedIn } for the modal.
 */
export function useInactivityTimeout({ enabled, onTimeout }) {
  const [isWarning, setIsWarning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(
    Math.floor(WARNING_MS / 1000)
  )

  // Refs, not state: these change on every mousemove and must not re-render.
  const lastActivityRef = useRef(now())
  const lastWriteRef = useRef(0)
  // Guards against onTimeout firing twice if a tick lands during teardown.
  const firedRef = useRef(false)

  // Held in a ref so the polling effect does not need it as a dependency —
  // otherwise a caller passing an inline arrow would tear down and rebuild the
  // interval on every render.
  const onTimeoutRef = useRef(onTimeout)
  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  const recordActivity = useCallback(
    ({ broadcast = true } = {}) => {
      const timestamp = now()
      lastActivityRef.current = timestamp

      if (timestamp - lastWriteRef.current < ACTIVITY_WRITE_THROTTLE_MS) return
      lastWriteRef.current = timestamp

      writeSharedActivity(timestamp)
      // Belt and braces: the `storage` event does not fire in the tab that
      // wrote the value, and BroadcastChannel reaches tabs that may have failed
      // to write. Both together mean every tab learns about the activity.
      if (broadcast) publishSessionEvent(SESSION_EVENTS.ACTIVITY, { timestamp })
    },
    []
  )

  /*
   * Dismiss the warning and restart the clock. Broadcast so that clicking
   * "Stay logged in" in one tab clears the modal in all of them — otherwise
   * every other tab keeps counting down and one of them signs everybody out.
   */
  const stayLoggedIn = useCallback(() => {
    lastWriteRef.current = 0 // force the write through the throttle
    recordActivity()
    setIsWarning(false)
    setSecondsRemaining(Math.floor(WARNING_MS / 1000))
  }, [recordActivity])

  // Seed from the shared value on mount so a tab opened next to an active one
  // does not start its own 30-minute clock from zero.
  useEffect(() => {
    if (!enabled) return
    const shared = readSharedActivity()
    lastActivityRef.current = Math.max(lastActivityRef.current, shared)
  }, [enabled])

  // Listen for real user input in THIS tab.
  useEffect(() => {
    if (!enabled) return

    const handler = () => recordActivity()
    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, handler, { passive: true })
    }

    return () => {
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, handler)
      }
    }
  }, [enabled, recordActivity])

  // Adopt activity reported by other tabs.
  useEffect(() => {
    if (!enabled) return

    return subscribeToSessionEvents((event) => {
      if (event.type !== SESSION_EVENTS.ACTIVITY) return
      const timestamp = Number(event.payload?.timestamp) || now()
      if (timestamp > lastActivityRef.current) {
        lastActivityRef.current = timestamp
        // Someone is using the app somewhere — retract the warning here too.
        setIsWarning(false)
      }
    })
  }, [enabled])

  // The clock.
  //
  // Note what this effect does NOT do: reset `isWarning` when `enabled` goes
  // false. Calling setState synchronously in an effect body triggers a
  // cascading render, and it is unnecessary here — the returned value is gated
  // on `enabled` instead, so a disabled timer reports no warning without any
  // extra state transition.
  useEffect(() => {
    if (!enabled) {
      firedRef.current = false
      return
    }

    const tick = () => {
      // Re-read the shared value every tick. localStorage writes from another
      // tab do not always surface as `storage` events in every browser, and
      // this makes the timer correct regardless.
      const shared = readSharedActivity()
      const lastActivity = Math.max(lastActivityRef.current, shared)
      lastActivityRef.current = lastActivity

      const idleFor = now() - lastActivity

      if (idleFor >= IDLE_LIMIT_MS + WARNING_MS) {
        if (firedRef.current) return
        firedRef.current = true
        setIsWarning(false)
        onTimeoutRef.current?.()
        return
      }

      if (idleFor >= IDLE_LIMIT_MS) {
        setIsWarning(true)
        setSecondsRemaining(
          Math.max(
            0,
            Math.ceil((IDLE_LIMIT_MS + WARNING_MS - idleFor) / 1000)
          )
        )
        return
      }

      setIsWarning(false)
    }

    // Run once almost immediately, so a tab restored after a long sleep does
    // not wait a full interval before noticing it should have signed out.
    // Deferred by a macrotask rather than called inline: calling it here would
    // setState synchronously inside the effect body and cascade a render.
    const immediate = setTimeout(tick, 0)
    const id = setInterval(tick, CHECK_INTERVAL_MS)

    return () => {
      clearTimeout(immediate)
      clearInterval(id)
    }
  }, [enabled])

  // Gated on `enabled` so a disabled timer can never report a stale warning
  // left over from before it was switched off.
  return { isWarning: enabled && isWarning, secondsRemaining, stayLoggedIn }
}

export { IDLE_LIMIT_MS, WARNING_MS }
