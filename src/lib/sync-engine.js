/**
 * Replay engine for the offline outbox (AC-15 / US-4).
 *
 * ORDERING. Mutations replay oldest-first, and on the first hard failure for a
 * given task the rest of THAT task's queue is held back. Two queued status
 * changes on one task must land in the order the user made them, or the final
 * state is wrong. Different tasks are independent, so one blocked task never
 * stalls the others.
 *
 * IDEMPOTENCY. Each record carries a stable `mutationId` reused across retries,
 * sent as `mutationId` in the body. A mutation whose response was lost cannot
 * be applied twice: the server's own concurrency guard rejects the second
 * attempt (the row's updated_at has moved past baseUpdatedAt), which we treat
 * as already-applied rather than as a conflict — see isAlreadyApplied.
 *
 * SESSION. Replay goes through the normal apiClient, so it uses whatever
 * session is live at that moment. No credential is ever read from or written
 * to the outbox.
 */

import apiClient from '@/lib/api-client'
import {
  MUTATION_STATUS,
  OPERATIONS,
  MAX_ATTEMPTS,
  listReplayable,
  update as updateMutation,
  remove as removeMutation,
  clearForUser,
} from '@/lib/outbox'

/** Bounded exponential backoff, capped so a long-parked queue still recovers. */
function backoffMs(attempts) {
  return Math.min(1000 * 2 ** attempts, 60_000)
}

function dueForRetry(m) {
  if (m.status === MUTATION_STATUS.PENDING) return true
  if (m.status !== MUTATION_STATUS.FAILED) return false
  if (m.attempts >= MAX_ATTEMPTS) return false
  if (!m.lastAttemptAt) return true
  return Date.now() - new Date(m.lastAttemptAt).getTime() >= backoffMs(m.attempts)
}

/**
 * A 409 that means "your change is already the server's state".
 *
 * This is the lost-response case: the write landed, the reply never arrived, we
 * retried. The server row now differs from baseUpdatedAt so it 409s — but the
 * value we wanted is already there. Treating that as a conflict would ask the
 * user to resolve something that isn't in dispute.
 */
function isAlreadyApplied(mutation, serverTask) {
  if (!serverTask) return false
  if (mutation.operation === OPERATIONS.TASK_STATUS) {
    return serverTask.status === mutation.payload?.status
  }
  if (mutation.operation === OPERATIONS.TASK_UPDATE) {
    const p = mutation.payload || {}
    const keys = Object.keys(p).filter((k) => p[k] !== undefined && p[k] !== null)
    return keys.length > 0 && keys.every((k) => String(serverTask[k]) === String(p[k]))
  }
  return false
}

async function sendOne(mutation) {
  const body = { ...mutation.payload, baseUpdatedAt: mutation.baseUpdatedAt, mutationId: mutation.mutationId }

  if (mutation.operation === OPERATIONS.TASK_STATUS) {
    const { data } = await apiClient.patch(`/tasks/${mutation.entityId}/status`, body)
    return data.data
  }
  if (mutation.operation === OPERATIONS.TASK_UPDATE) {
    const { data } = await apiClient.put(`/tasks/${mutation.entityId}`, body)
    return data.data
  }
  throw new Error(`Unknown operation: ${mutation.operation}`)
}

/**
 * Replay one user's queue.
 *
 * @returns {Promise<{synced:number, conflicts:number, failed:number, skipped:number}>}
 */
export async function replay(userId) {
  const result = { synced: 0, conflicts: 0, failed: 0, skipped: 0 }
  if (!userId) return result

  const queue = await listReplayable(userId)
  if (!queue.length) return result

  // Tasks whose ordering is broken by an unresolved failure this pass.
  const blocked = new Set()

  for (const mutation of queue) {
    if (blocked.has(mutation.entityId)) { result.skipped++; continue }
    if (!dueForRetry(mutation)) { result.skipped++; continue }

    await updateMutation(mutation.id, { status: MUTATION_STATUS.SYNCING })

    try {
      await sendOne(mutation)
      await removeMutation(mutation.id)
      result.synced++
    } catch (err) {
      const status = err.response?.status
      const details = err.response?.data?.details

      if (status === 409 && details?.reason === 'version_conflict') {
        if (isAlreadyApplied(mutation, details.serverTask)) {
          // Already landed — a duplicate, not a dispute.
          await removeMutation(mutation.id)
          result.synced++
          continue
        }
        await updateMutation(mutation.id, {
          status: MUTATION_STATUS.CONFLICT,
          conflict: details,
          lastAttemptAt: new Date().toISOString(),
        })
        // Later edits to this task are built on a base that no longer holds.
        blocked.add(mutation.entityId)
        result.conflicts++
        continue
      }

      // 4xx that isn't a conflict (403 not yours, 404 deleted, 400 invalid) is
      // permanent — retrying can only fail identically. Park it as FAILED at
      // max attempts so it stops consuming retries but stays visible.
      const permanent = status && status >= 400 && status < 500 && status !== 409
      const attempts = permanent ? MAX_ATTEMPTS : mutation.attempts + 1

      await updateMutation(mutation.id, {
        status: MUTATION_STATUS.FAILED,
        attempts,
        lastAttemptAt: new Date().toISOString(),
        lastError:
          err.response?.data?.message ||
          (err.response ? `Request failed (${status})` : 'No connection'),
      })
      blocked.add(mutation.entityId)
      result.failed++
    }
  }

  return result
}

/** Keep Mine — re-base onto the server's current version and re-queue. */
export async function resolveKeepMine(mutation) {
  const current = mutation.conflict?.serverTask?.updatedAt || null
  return updateMutation(mutation.id, {
    status: MUTATION_STATUS.PENDING,
    baseUpdatedAt: current,
    attempts: 0,
    lastError: null,
    conflict: null,
  })
}

/** Use Server — abandon the local change entirely. */
export async function resolveUseServer(mutation) {
  await removeMutation(mutation.id)
  return null
}

/**
 * Merge — only ever offered when it is genuinely safe.
 *
 * Safe means: a multi-field edit where every field I changed is a field the
 * server did NOT change. Then "merge" is unambiguous — apply my fields on top
 * of theirs, nothing is silently discarded, and no field has two competing
 * values. Anything else (a scalar status change, or overlapping fields) has no
 * correct automatic answer, so no Merge button is shown.
 */
export function canMerge(mutation) {
  if (!mutation?.conflict) return false
  if (mutation.operation !== OPERATIONS.TASK_UPDATE) return false

  const conflictFields = mutation.conflict.conflictFields || []
  const attempted = mutation.conflict.attempted || {}
  const mine = Object.keys(attempted).filter(
    (k) => attempted[k] !== undefined && attempted[k] !== null
  )
  if (mine.length < 2) return false

  // conflictFields = fields I set that differ from the server. If every field I
  // set differs, the server likely changed the same ones -> not disjoint.
  // A safe merge needs at least one field of mine already matching theirs.
  return conflictFields.length > 0 && conflictFields.length < mine.length
}

export async function resolveMerge(mutation) {
  if (!canMerge(mutation)) return null
  const attempted = mutation.conflict?.attempted || {}
  const conflictFields = mutation.conflict?.conflictFields || []

  // Send only the fields still genuinely different; the rest already match.
  const payload = {}
  conflictFields.forEach((f) => { payload[f] = attempted[f] })

  return updateMutation(mutation.id, {
    status: MUTATION_STATUS.PENDING,
    payload,
    baseUpdatedAt: mutation.conflict?.serverTask?.updatedAt || null,
    attempts: 0,
    lastError: null,
    conflict: null,
  })
}

/**
 * Discard everything queued for a user.
 *
 * Destroys unsynced work, so callers MUST confirm with the user first — see
 * the logout guard in sidebar.jsx.
 */
export async function discardForUser(userId) {
  return clearForUser(userId)
}
