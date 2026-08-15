/**
 * Cross-tab replay lock for the offline outbox.
 *
 * WHY. IndexedDB has no cross-tab locking. Two tabs coming online together
 * both read the same pending queue and both start sending, so a mutation can
 * go out twice. The server's mutationId + baseUpdatedAt guard means the
 * duplicate is *rejected* rather than applied twice — correctness was never at
 * risk — but it produces spurious 409s and doubled traffic. This makes the
 * common case clean; the server guard stays as the real backstop.
 *
 * DESIGN: a localStorage lease, not a BroadcastChannel handshake.
 * BroadcastChannel can announce intent but cannot arbitrate it — two tabs can
 * post "I'm starting" in the same tick and both proceed. A lease written to
 * localStorage is durable, readable by every tab, and (critically) SURVIVES A
 * CRASHED OR CLOSED TAB, which is why it carries an expiry: a tab killed
 * mid-replay must not hold the lock forever. BroadcastChannel is still used,
 * but only as an optimisation — to wake other tabs the moment a lock frees,
 * rather than making them wait out the poll.
 *
 * The lease is per-user, so two people signed into different tabs on a shared
 * machine never contend, and one user's lock never blocks another's replay.
 */

const KEY_PREFIX = 'varadhi_replay_lock:'
const CHANNEL = 'varadhi-replay'

/** How long a lease is honoured before other tabs may steal it. */
export const LEASE_MS = 30_000
/** Re-stamped this often while a replay runs, so long syncs don't self-expire. */
export const HEARTBEAT_MS = 10_000

function keyFor(userId) {
  return `${KEY_PREFIX}${userId}`
}

function now() {
  return Date.now()
}

function readLease(userId) {
  try {
    const raw = localStorage.getItem(keyFor(userId))
    if (!raw) return null
    const lease = JSON.parse(raw)
    if (!lease || typeof lease.expiresAt !== 'number') return null
    return lease
  } catch {
    return null
  }
}

/** A unique id per tab, stable for the tab's lifetime. */
let tabId = null
function getTabId() {
  if (tabId) return tabId
  tabId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`
  return tabId
}

/**
 * Try to take the lock.
 *
 * @returns {{acquired: boolean, reason?: string}} — never throws; if storage is
 *          unavailable we return acquired:true, because degrading to "no
 *          cross-tab coordination" is strictly better than blocking all replay.
 */
export function acquire(userId) {
  if (!userId) return { acquired: false, reason: 'no_user' }
  if (typeof localStorage === 'undefined') return { acquired: true, reason: 'no_storage' }

  const existing = readLease(userId)
  if (existing && existing.expiresAt > now() && existing.tabId !== getTabId()) {
    return { acquired: false, reason: 'held_by_other_tab' }
  }

  const lease = { tabId: getTabId(), acquiredAt: now(), expiresAt: now() + LEASE_MS }
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(lease))
  } catch {
    // Quota or private mode — proceed rather than deadlock.
    return { acquired: true, reason: 'no_storage' }
  }

  // Last-write-wins check: if two tabs raced, whoever's value is actually in
  // storage owns it. Re-reading is cheap and closes the window.
  const confirmed = readLease(userId)
  if (!confirmed || confirmed.tabId !== getTabId()) {
    return { acquired: false, reason: 'lost_race' }
  }
  return { acquired: true }
}

/** Extend our own lease. No-op if we no longer hold it. */
export function renew(userId) {
  if (!userId || typeof localStorage === 'undefined') return false
  const lease = readLease(userId)
  if (!lease || lease.tabId !== getTabId()) return false
  try {
    localStorage.setItem(
      keyFor(userId),
      JSON.stringify({ ...lease, expiresAt: now() + LEASE_MS })
    )
    return true
  } catch {
    return false
  }
}

/**
 * Release the lock — only if we hold it, so a tab can never free another's
 * lease. Broadcasts so waiting tabs can start immediately.
 */
export function release(userId) {
  if (!userId || typeof localStorage === 'undefined') return false
  const lease = readLease(userId)
  if (lease && lease.tabId !== getTabId()) return false
  try {
    localStorage.removeItem(keyFor(userId))
  } catch {
    /* nothing useful to do */
  }
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel(CHANNEL)
      ch.postMessage({ type: 'released', userId })
      ch.close()
    }
  } catch {
    /* BroadcastChannel unsupported — waiting tabs fall back to their own poll */
  }
  return true
}

/** True when someone else currently holds a live lease. */
export function isHeldByOther(userId) {
  const lease = readLease(userId)
  return Boolean(lease && lease.expiresAt > now() && lease.tabId !== getTabId())
}

/**
 * Run `fn` under the lock.
 *
 * Releases on success, on throw, and keeps the lease warm with a heartbeat
 * while it runs. Returns `null` when the lock could not be taken, which the
 * caller treats as "another tab is handling it".
 */
export async function withLock(userId, fn) {
  const got = acquire(userId)
  if (!got.acquired) return null

  const beat = setInterval(() => renew(userId), HEARTBEAT_MS)
  try {
    return await fn()
  } finally {
    clearInterval(beat)
    release(userId)
  }
}

/** Notify waiting tabs; used by the hook to retry promptly when a lock frees. */
export function onReleased(handler) {
  if (typeof BroadcastChannel === 'undefined') return () => {}
  let ch
  try {
    ch = new BroadcastChannel(CHANNEL)
  } catch {
    return () => {}
  }
  const listener = (e) => {
    if (e.data?.type === 'released') handler(e.data.userId)
  }
  ch.addEventListener('message', listener)
  return () => {
    try { ch.removeEventListener('message', listener); ch.close() } catch { /* closed */ }
  }
}

export const __testing = { keyFor, readLease, getTabId, resetTabId: () => { tabId = null } }
