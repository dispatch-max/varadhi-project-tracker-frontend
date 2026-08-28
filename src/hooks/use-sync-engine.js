'use client'

import { useCallback, useEffect, useRef } from 'react'

import { replay } from '@/lib/sync-engine'
import { withLock, release, onReleased } from '@/lib/replay-lock'
import { useAuthStore } from '@/store/auth.store'
import { useConnectivityStore } from '@/store/connectivity.store'
import { useOutboxStore } from '@/store/outbox.store'

/**
 * Drives outbox replay (AC-15).
 *
 * Runs on three triggers:
 *   1. Mount — a refresh mid-queue must not strand pending work.
 *   2. The browser's `online` event.
 *   3. The connectivity store flipping back to online, which also catches the
 *      captive-portal case navigator.onLine misses.
 *
 * A ref guard makes overlapping runs impossible: two concurrent replays of the
 * same queue could double-send a mutation between the read and the status
 * write. IndexedDB gives no cross-tab lock, so this is per-tab; the server's
 * concurrency guard is the real backstop (a duplicate 409s and is recognised
 * as already-applied).
 */
export function useSyncEngine() {
  const user = useAuthStore((s) => s.user)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isOffline = useConnectivityStore((s) => s.isOffline)
  const refresh = useOutboxStore((s) => s.refresh)
  const setSyncing = useOutboxStore((s) => s.setSyncing)
  const setResult = useOutboxStore((s) => s.setResult)

  const running = useRef(false)
  const userId = user?.id || null

  const run = useCallback(async () => {
    if (!userId || running.current) return
    running.current = true
    setSyncing(true)
    try {
      // Cross-tab lock: only one tab replays a given user's queue at a time.
      // `withLock` returns null when another tab holds it — not an error, just
      // someone else's turn, so we quietly stand down and let their run cover
      // our queue too (it is the same queue).
      const result = await withLock(userId, () => replay(userId))
      if (result) setResult(result)
      else setSyncing(false)
      await refresh(userId)
    } catch {
      // Replay is best-effort; a failure here must never surface as an app
      // crash. Individual mutations already record their own lastError.
      setSyncing(false)
    } finally {
      running.current = false
    }
  }, [userId, refresh, setSyncing, setResult])

  // Load whatever is queued as soon as we know who the user is. Covers the
  // "refresh before replay" case — the queue survives and is picked back up.
  useEffect(() => {
    if (!isAuthenticated || !userId) return
    refresh(userId)
  }, [isAuthenticated, userId, refresh])

  // Replay when connectivity returns.
  useEffect(() => {
    if (!isAuthenticated || !userId) return
    if (isOffline) return
    run()
  }, [isAuthenticated, userId, isOffline, run])

  // The browser event, independent of the store's own signal.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const onOnline = () => run()
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [run])

  // Another tab finished its replay — try again promptly rather than waiting
  // for the next trigger. Our own queue may still hold work it skipped.
  useEffect(() => {
    if (!userId) return
    return onReleased((freedFor) => {
      if (freedFor === userId) run()
    })
  }, [userId, run])

  // Release the lease if this tab goes away mid-replay. Without this the lock
  // would be held until the lease expires, stalling every other tab for up to
  // LEASE_MS. Belt and braces — the expiry already bounds the damage.
  useEffect(() => {
    if (typeof window === 'undefined' || !userId) return
    const onGone = () => { if (running.current) release(userId) }
    window.addEventListener('pagehide', onGone)
    return () => {
      window.removeEventListener('pagehide', onGone)
      // Unmount (logout, navigation away) — never leave a lease behind.
      release(userId)
    }
  }, [userId])

  return { syncNow: run }
}

export default useSyncEngine
