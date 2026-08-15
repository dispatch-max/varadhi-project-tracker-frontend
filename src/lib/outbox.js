/**
 * IndexedDB outbox for offline task mutations (AC-15 / US-4).
 *
 * Raw IndexedDB, no wrapper library — consistent with the rest of this feature
 * set (hand-written service worker, zero-dependency icon generator) and it
 * keeps the bundle unchanged.
 *
 * SECURITY: this store holds mutation INTENT only — task id, operation,
 * payload, timestamps. Never a token, never an auth header, never user
 * credentials. Replay authenticates with the live session read at replay time,
 * exactly as a normal request does. IndexedDB survives logout, so anything
 * secret written here would outlive the session that created it.
 *
 * ISOLATION: every record carries `userId` and all reads go through an index on
 * it. One user's queued work can never surface in another user's session, even
 * on a shared device, and even before any logout cleanup runs.
 */

const DB_NAME = 'varadhi-outbox'
const DB_VERSION = 1
const STORE = 'mutations'

export const MUTATION_STATUS = {
  PENDING: 'pending',
  SYNCING: 'syncing',
  CONFLICT: 'conflict',
  FAILED: 'failed',
}

export const OPERATIONS = {
  TASK_STATUS: 'task.status',
  TASK_UPDATE: 'task.update',
}

/** Bounded retry — after this many transport failures the row parks as FAILED. */
export const MAX_ATTEMPTS = 5

function isSupported() {
  return typeof indexedDB !== 'undefined'
}

let dbPromise = null

function openDb() {
  if (!isSupported()) return Promise.resolve(null)
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve) => {
    let req
    try {
      req = indexedDB.open(DB_NAME, DB_VERSION)
    } catch {
      resolve(null)
      return
    }

    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        // Scope every query by user — the isolation guarantee.
        store.createIndex('userId', 'userId', { unique: false })
        // Replay order is creation order.
        store.createIndex('createdAt', 'createdAt', { unique: false })
        // Lets a later mutation on the same task find its predecessor.
        store.createIndex('entityId', 'entityId', { unique: false })
      }
    }

    req.onsuccess = () => resolve(req.result)
    // Private mode, disabled storage, or a blocked upgrade. The app must stay
    // usable without an outbox, so this degrades to "no queuing" rather than
    // throwing into the UI.
    req.onerror = () => resolve(null)
    req.onblocked = () => resolve(null)
  })

  return dbPromise
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    let out
    const t = db.transaction(STORE, mode)
    t.oncomplete = () => resolve(out)
    t.onerror = () => reject(t.error)
    t.onabort = () => reject(t.error)
    out = fn(t.objectStore(STORE))
  })
}

function reqToPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Queue a mutation.
 *
 * `mutationId` is the idempotency key. It is generated here, persisted, and
 * reused across every replay attempt, so a mutation that succeeded server-side
 * but whose response was lost cannot be applied twice on retry.
 */
export async function enqueue({ userId, operation, entityId, payload, baseUpdatedAt }) {
  const db = await openDb()
  if (!db || !userId) return null

  const record = {
    id: cryptoRandomId(),
    mutationId: cryptoRandomId(),
    userId,
    operation,
    entityId,
    payload,
    baseUpdatedAt: baseUpdatedAt || null,
    createdAt: new Date().toISOString(),
    status: MUTATION_STATUS.PENDING,
    attempts: 0,
    lastError: null,
    lastAttemptAt: null,
    conflict: null,
  }

  await tx(db, 'readwrite', (store) => store.put(record))
  return record
}

/** Every record for one user, oldest first — the replay order. */
export async function listForUser(userId) {
  const db = await openDb()
  if (!db || !userId) return []

  const all = await tx(db, 'readonly', (store) =>
    reqToPromise(store.index('userId').getAll(userId))
  ).catch(() => [])

  return (all || []).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function countForUser(userId) {
  return (await listForUser(userId)).length
}

/** Pending or previously-failed work, in order. Conflicts are excluded — they need a human. */
export async function listReplayable(userId) {
  const all = await listForUser(userId)
  return all.filter(
    (m) => m.status === MUTATION_STATUS.PENDING || m.status === MUTATION_STATUS.FAILED
  )
}

export async function listConflicts(userId) {
  const all = await listForUser(userId)
  return all.filter((m) => m.status === MUTATION_STATUS.CONFLICT)
}

export async function update(id, patch) {
  const db = await openDb()
  if (!db) return null

  const existing = await tx(db, 'readonly', (store) => reqToPromise(store.get(id))).catch(() => null)
  if (!existing) return null

  const next = { ...existing, ...patch }
  await tx(db, 'readwrite', (store) => store.put(next))
  return next
}

export async function remove(id) {
  const db = await openDb()
  if (!db) return false
  await tx(db, 'readwrite', (store) => store.delete(id)).catch(() => {})
  return true
}

/**
 * Drop every queued mutation for one user.
 *
 * Called on logout and on user switch — but only ever behind an explicit
 * confirmation when the queue is non-empty, because this destroys work the
 * user believes is saved. See sync-engine.js#discardForUser.
 */
export async function clearForUser(userId) {
  const db = await openDb()
  if (!db || !userId) return 0

  const rows = await listForUser(userId)
  if (!rows.length) return 0

  await tx(db, 'readwrite', (store) => {
    rows.forEach((r) => store.delete(r.id))
  })
  return rows.length
}

/**
 * Nuclear option — every user's queue. Used only by the 401 path, where we
 * cannot know which user the dead session belonged to.
 */
export async function clearAll() {
  const db = await openDb()
  if (!db) return 0
  const all = await tx(db, 'readonly', (store) => reqToPromise(store.getAll())).catch(() => [])
  await tx(db, 'readwrite', (store) => store.clear()).catch(() => {})
  return (all || []).length
}

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `m-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const __testing = { DB_NAME, STORE, openDb }
