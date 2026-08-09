/*
 * Offline outbox + sync engine tests (AC-15 / US-4).
 *
 * Runs the REAL src/lib/outbox.js and src/lib/sync-engine.js against a
 * fake-indexeddb-style in-memory implementation and a mock apiClient, so the
 * shipped logic is exercised rather than a re-description of it.
 */
import { readFileSync } from 'node:fs'

const ROOT = 'c:/Users/USER/Documents/VC Work/varadhi -project-tracker/varadhi-tracker'
let pass = 0, fail = 0
const check = (n, c, e = '') => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${e}`)) }

/* ---------- minimal in-memory IndexedDB ---------------------------------- */
function makeIndexedDB() {
  const stores = new Map()
  const req = (fn) => {
    const r = { onsuccess: null, onerror: null, result: undefined }
    queueMicrotask(() => { try { r.result = fn(); r.onsuccess?.() } catch (e) { r.error = e; r.onerror?.() } })
    return r
  }
  return {
    open(name) {
      const r = { onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null, result: null }
      queueMicrotask(() => {
        if (!stores.has(name)) {
          stores.set(name, new Map())
          r.result = makeDb(name)
          r.onupgradeneeded?.()
        }
        r.result = makeDb(name)
        r.onsuccess?.()
      })
      return r
    },
    _stores: stores,
  }
  function makeDb(name) {
    return {
      objectStoreNames: { contains: () => stores.has(name) },
      createObjectStore: () => ({ createIndex: () => {} }),
      transaction(_s, _mode) {
        const t = { oncomplete: null, onerror: null, onabort: null }
        const data = stores.get(name)
        queueMicrotask(() => t.oncomplete?.())
        return {
          ...t,
          objectStore: () => ({
            put: (v) => { data.set(v.id, v); return req(() => v) },
            get: (id) => req(() => data.get(id)),
            delete: (id) => { data.delete(id); return req(() => true) },
            clear: () => { data.clear(); return req(() => true) },
            getAll: () => req(() => [...data.values()]),
            index: (field) => ({
              getAll: (val) => req(() => [...data.values()].filter((r) => r[field] === val)),
            }),
          }),
          set oncomplete(fn) { t.oncomplete = fn; queueMicrotask(() => fn?.()) },
          set onerror(fn) { t.onerror = fn },
          set onabort(fn) { t.onabort = fn },
        }
      },
    }
  }
}

globalThis.indexedDB = makeIndexedDB()
// Node 20 exposes `crypto` as a getter-only global that already provides
// randomUUID, which is exactly what outbox.js reaches for. Nothing to stub.

/* ---------- mock apiClient ------------------------------------------------ */
const calls = []
let handler = async () => ({ data: { data: { ok: true } } })
const apiClient = {
  patch: async (url, body) => { calls.push({ m: 'PATCH', url, body }); return handler('PATCH', url, body) },
  put: async (url, body) => { calls.push({ m: 'PUT', url, body }); return handler('PUT', url, body) },
}
const httpError = (status, data) => Object.assign(new Error(`HTTP ${status}`), { response: { status, data } })

/* ---------- load the real modules ---------------------------------------- */
async function load(rel, subs = {}) {
  let src = readFileSync(`${ROOT}/${rel}`, 'utf8')
  for (const [spec, url] of Object.entries(subs)) {
    src = src.replaceAll(`from '${spec}'`, `from '${url}'`)
  }
  return import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`)
}

const outboxUrl = `data:text/javascript;base64,${Buffer.from(readFileSync(`${ROOT}/src/lib/outbox.js`, 'utf8')).toString('base64')}`
const apiUrl = `data:text/javascript;base64,${Buffer.from(
  `export default ${'globalThis.__apiClient'}`).toString('base64')}`
globalThis.__apiClient = apiClient

const outbox = await import(outboxUrl)
const sync = await load('src/lib/sync-engine.js', {
  '@/lib/api-client': apiUrl,
  '@/lib/outbox': outboxUrl,
})

const USER_A = 'user-a'
const USER_B = 'user-b'
const reset = async () => { await outbox.clearAll(); calls.length = 0; handler = async () => ({ data: { data: { ok: true } } }) }

/* ========================================================================== */
console.log('\n1. Offline status mutation is created and persisted')
{
  await reset()
  const m = await outbox.enqueue({
    userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS,
    entityId: 'task-1', payload: { status: 'in_progress' },
    baseUpdatedAt: '2026-08-08T09:00:00.000Z',
  })
  check('returns a record', Boolean(m?.id))
  check('has a mutationId (idempotency key)', Boolean(m.mutationId))
  check('records entityId', m.entityId === 'task-1')
  check('records operation', m.operation === 'task.status')
  check('records payload', m.payload.status === 'in_progress')
  check('records baseUpdatedAt', m.baseUpdatedAt === '2026-08-08T09:00:00.000Z')
  check('records createdAt', Boolean(m.createdAt))
  check('starts pending with 0 attempts', m.status === 'pending' && m.attempts === 0)
  check('stores NO credential', !JSON.stringify(m).match(/token|password|authorization/i))

  const persisted = await outbox.listForUser(USER_A)
  check('survives a re-read (IndexedDB persistence)', persisted.length === 1 && persisted[0].id === m.id)
}

console.log('\n2. Offline detail-form (multi-field) mutation')
{
  await reset()
  await outbox.enqueue({
    userId: USER_A, operation: outbox.OPERATIONS.TASK_UPDATE,
    entityId: 'task-2', payload: { title: 'Mine', priority: 'high' },
    baseUpdatedAt: '2026-08-08T09:00:00.000Z',
  })
  const all = await outbox.listForUser(USER_A)
  check('queued as task.update', all[0].operation === 'task.update')
  check('multi-field payload intact', all[0].payload.title === 'Mine' && all[0].payload.priority === 'high')
}

console.log('\n3. User A / User B outbox isolation')
{
  await reset()
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 't1', payload: { status: 'todo' } })
  await outbox.enqueue({ userId: USER_B, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 't2', payload: { status: 'completed' } })

  const a = await outbox.listForUser(USER_A)
  const b = await outbox.listForUser(USER_B)
  check('A sees only A', a.length === 1 && a[0].entityId === 't1')
  check('B sees only B', b.length === 1 && b[0].entityId === 't2')
  check("A's data never appears for B", !b.some((m) => m.userId === USER_A))

  await outbox.clearForUser(USER_A)
  check('clearing A leaves B intact', (await outbox.listForUser(USER_B)).length === 1)
  check('A is empty after clear', (await outbox.listForUser(USER_A)).length === 0)
}

console.log('\n4. Replay after reconnect — success path')
{
  await reset()
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 't1', payload: { status: 'in_progress' }, baseUpdatedAt: 'B1' })
  const r = await sync.replay(USER_A)
  check('one mutation synced', r.synced === 1, JSON.stringify(r))
  check('PATCH sent to the right URL', calls[0]?.url === '/tasks/t1/status')
  check('baseUpdatedAt forwarded', calls[0]?.body.baseUpdatedAt === 'B1')
  check('mutationId forwarded (idempotency)', Boolean(calls[0]?.body.mutationId))
  check('queue drained on success', (await outbox.listForUser(USER_A)).length === 0)
}

console.log('\n5. Ordering — mutations replay oldest-first')
{
  await reset()
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 't1', payload: { status: 'in_progress' } })
  await new Promise((r) => setTimeout(r, 5))
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 't1', payload: { status: 'in_review' } })
  await sync.replay(USER_A)
  check('sent in creation order',
    calls[0]?.body.status === 'in_progress' && calls[1]?.body.status === 'in_review',
    JSON.stringify(calls.map((c) => c.body.status)))
}

console.log('\n6. Duplicate replay prevention')
{
  await reset()
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 't1', payload: { status: 'done' } })
  await sync.replay(USER_A)
  const after = calls.length
  await sync.replay(USER_A)   // nothing left to send
  check('second replay sends nothing', calls.length === after, `${after} -> ${calls.length}`)

  // The lost-response case: server already has my value, responds 409.
  await reset()
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 't1', payload: { status: 'in_progress' } })
  handler = async () => { throw httpError(409, { details: { reason: 'version_conflict', serverTask: { id: 't1', status: 'in_progress' } } }) }
  const r = await sync.replay(USER_A)
  check('409 whose value already matches = already applied, not a conflict',
    r.synced === 1 && r.conflicts === 0, JSON.stringify(r))
  check('queue drained (no phantom conflict)', (await outbox.listForUser(USER_A)).length === 0)
}

console.log('\n7. Conflict detection')
{
  await reset()
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 't1', payload: { status: 'in_review' }, baseUpdatedAt: 'OLD' })
  handler = async () => { throw httpError(409, { details: {
    reason: 'version_conflict', conflictFields: ['status'],
    attempted: { status: 'in_review' },
    serverTask: { id: 't1', status: 'completed', updatedAt: 'NEW' } } }) }
  const r = await sync.replay(USER_A)
  check('reported as a conflict', r.conflicts === 1 && r.synced === 0, JSON.stringify(r))
  const c = await outbox.listConflicts(USER_A)
  check('parked as CONFLICT (not retried blindly)', c.length === 1 && c[0].status === 'conflict')
  check('conflict detail retained for the UI', c[0].conflict?.serverTask?.status === 'completed')
}

console.log('\n8. Keep Mine')
{
  const [c] = await outbox.listConflicts(USER_A)
  await sync.resolveKeepMine(c)
  const [m] = await outbox.listForUser(USER_A)
  check('re-queued as pending', m.status === 'pending')
  check('re-based onto the server version', m.baseUpdatedAt === 'NEW', String(m.baseUpdatedAt))
  check('my payload preserved', m.payload.status === 'in_review')
  check('conflict cleared', m.conflict === null)
  check('attempts reset', m.attempts === 0)
}

console.log('\n9. Use Server')
{
  await reset()
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 't1', payload: { status: 'x' } })
  const [m] = await outbox.listForUser(USER_A)
  await sync.resolveUseServer(m)
  check('local change discarded entirely', (await outbox.listForUser(USER_A)).length === 0)
}

console.log('\n10. Merge is offered only when genuinely safe')
{
  const scalar = { operation: 'task.status', conflict: { conflictFields: ['status'], attempted: { status: 'x' } } }
  check('never for a scalar status change', sync.canMerge(scalar) === false)

  const overlapping = { operation: 'task.update', conflict: { conflictFields: ['title', 'priority'], attempted: { title: 'a', priority: 'b' } } }
  check('never when every field I set also changed', sync.canMerge(overlapping) === false)

  const disjoint = { operation: 'task.update', conflict: { conflictFields: ['title'], attempted: { title: 'a', priority: 'b' } } }
  check('yes when the edits are disjoint', sync.canMerge(disjoint) === true)

  const single = { operation: 'task.update', conflict: { conflictFields: ['title'], attempted: { title: 'a' } } }
  check('never for a single-field edit', sync.canMerge(single) === false)
}

console.log('\n11. Safe Merge applies only the still-differing fields')
{
  await reset()
  const rec = await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_UPDATE, entityId: 't1', payload: { title: 'Mine', priority: 'low' } })
  await outbox.update(rec.id, { status: 'conflict', conflict: {
    conflictFields: ['title'], attempted: { title: 'Mine', priority: 'low' },
    serverTask: { id: 't1', updatedAt: 'NEW', title: 'Theirs', priority: 'low' } } })
  const [c] = await outbox.listConflicts(USER_A)
  await sync.resolveMerge(c)
  const [m] = await outbox.listForUser(USER_A)
  check('re-queued pending', m.status === 'pending')
  check('sends only the differing field', JSON.stringify(m.payload) === JSON.stringify({ title: 'Mine' }), JSON.stringify(m.payload))
  check('re-based on server version', m.baseUpdatedAt === 'NEW')
}

console.log('\n12. Retry after a transient failure, with bounded attempts')
{
  await reset()
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 't1', payload: { status: 'x' } })
  handler = async () => { throw Object.assign(new Error('Network Error'), {}) }  // no response = transport
  const r1 = await sync.replay(USER_A)
  check('transport failure counted as failed', r1.failed === 1, JSON.stringify(r1))
  const [m1] = await outbox.listForUser(USER_A)
  check('kept in the queue for retry', m1.status === 'failed' && m1.attempts === 1)
  check('records why', /connection/i.test(m1.lastError || ''), m1.lastError)

  // A permanent 4xx should not burn retries forever.
  await reset()
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 't1', payload: { status: 'x' } })
  handler = async () => { throw httpError(403, { message: 'Not yours' }) }
  await sync.replay(USER_A)
  const [m2] = await outbox.listForUser(USER_A)
  check('permanent 4xx parks at MAX_ATTEMPTS', m2.attempts === outbox.MAX_ATTEMPTS, String(m2.attempts))
  check('surfaces the server reason', m2.lastError === 'Not yours', m2.lastError)

  // Success after a failure clears it.
  handler = async () => ({ data: { data: { ok: true } } })
  await outbox.update(m2.id, { status: 'pending', attempts: 0 })
  const r3 = await sync.replay(USER_A)
  check('retry succeeds once the cause clears', r3.synced === 1, JSON.stringify(r3))
}

console.log('\n13. Refresh before replay — the queue survives')
{
  await reset()
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 't1', payload: { status: 'x' } })
  // Simulate a page refresh: drop every in-memory handle, re-import the module.
  const fresh = await import(outboxUrl + '#reload')
  const survived = await fresh.listForUser(USER_A)
  check('pending mutation still present after reload', survived.length === 1, String(survived.length))
  check('still replayable', survived[0].status === 'pending')
}

console.log('\n14. Ordering is held back per-task on failure')
{
  await reset()
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 'tA', payload: { status: '1' } })
  await new Promise((r) => setTimeout(r, 5))
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 'tA', payload: { status: '2' } })
  await new Promise((r) => setTimeout(r, 5))
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 'tB', payload: { status: '3' } })

  let n = 0
  handler = async (_m, url) => {
    n++
    if (url === '/tasks/tA/status' && n === 1) throw Object.assign(new Error('Network Error'), {})
    return { data: { data: { ok: true } } }
  }
  const r = await sync.replay(USER_A)
  const sentTa = calls.filter((c) => c.url === '/tasks/tA/status').length
  check('a failed task does not send its later edits out of order', sentTa === 1, `sent ${sentTa}`)
  check('an unrelated task still syncs', calls.some((c) => c.url === '/tasks/tB/status'))
  check('result accounts for the skip', r.skipped >= 1, JSON.stringify(r))
}

console.log('\n15. Logout discard is explicit and scoped')
{
  await reset()
  await outbox.enqueue({ userId: USER_A, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 't1', payload: { status: 'x' } })
  await outbox.enqueue({ userId: USER_B, operation: outbox.OPERATIONS.TASK_STATUS, entityId: 't2', payload: { status: 'y' } })

  const count = await outbox.countForUser(USER_A)
  check('count drives the confirmation prompt', count === 1, String(count))

  const removed = await sync.discardForUser(USER_A)
  check('discard reports how many were destroyed', removed === 1, String(removed))
  check("A's queue is gone", (await outbox.listForUser(USER_A)).length === 0)
  check("B's queue untouched by A's logout", (await outbox.listForUser(USER_B)).length === 1)
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
