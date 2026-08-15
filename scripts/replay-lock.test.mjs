/*
 * Cross-tab replay lock tests.
 *
 * Loads the REAL src/lib/replay-lock.js twice against ONE shared localStorage,
 * which is exactly what two browser tabs are: separate module instances, same
 * origin storage.
 */
import { readFileSync } from 'node:fs'

const ROOT = 'c:/Users/USER/Documents/VC Work/varadhi -project-tracker/varadhi-tracker'
let pass = 0, fail = 0
const check = (n, c, e = '') => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${e}`)) }

/* Shared origin storage — both "tabs" see the same map. */
const store = new Map()
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
}
// No BroadcastChannel in Node — the lock must degrade gracefully without it.
delete globalThis.BroadcastChannel

const src = readFileSync(`${ROOT}/src/lib/replay-lock.js`, 'utf8')
const load = () => import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}#${Math.random()}`)

const tabA = await load()
const tabB = await load()
const U = 'user-1'
const OTHER = 'user-2'
const reset = () => store.clear()

console.log('\n1. Acquisition')
{
  reset()
  const r = tabA.acquire(U)
  check('first tab acquires', r.acquired === true, JSON.stringify(r))
  check('a lease is written to storage', store.size === 1)
  check('lease is namespaced per user', [...store.keys()][0].includes(U))

  const lease = JSON.parse([...store.values()][0])
  check('lease carries a tabId', Boolean(lease.tabId))
  check('lease carries an expiry', typeof lease.expiresAt === 'number' && lease.expiresAt > Date.now())
  check('lease stores NO secret', !JSON.stringify(lease).match(/token|password|auth/i))
}

console.log('\n2. Competing tabs — only one may replay')
{
  reset()
  const a = tabA.acquire(U)
  const b = tabB.acquire(U)
  check('tab A acquires', a.acquired === true)
  check('tab B is refused while A holds it', b.acquired === false, JSON.stringify(b))
  check('B is told why', b.reason === 'held_by_other_tab', b.reason)
  check('B sees the lock as held', tabB.isHeldByOther(U) === true)
  check('A does not see its own lock as foreign', tabA.isHeldByOther(U) === false)
}

console.log('\n3. Re-entrancy — the holder may re-acquire')
{
  reset()
  tabA.acquire(U)
  check('same tab can re-acquire (no self-deadlock)', tabA.acquire(U).acquired === true)
}

console.log('\n4. Release')
{
  reset()
  tabA.acquire(U)
  check('B blocked before release', tabB.acquire(U).acquired === false)
  tabA.release(U)
  check('lease removed from storage', store.size === 0)
  check('B can now acquire', tabB.acquire(U).acquired === true)
  tabB.release(U)
}

console.log('\n5. A tab cannot release a lease it does not hold')
{
  reset()
  tabA.acquire(U)
  const stolen = tabB.release(U)
  check('B refused to release A\'s lease', stolen === false)
  check("A's lease survives", store.size === 1)
  check('B still blocked', tabB.acquire(U).acquired === false)
}

console.log('\n6. Lease expiry — a crashed tab must not hold the lock forever')
{
  reset()
  tabA.acquire(U)
  check('B blocked while the lease is live', tabB.acquire(U).acquired === false)

  // Simulate tab A vanishing: rewind its lease past expiry.
  const key = [...store.keys()][0]
  const lease = JSON.parse(store.get(key))
  store.set(key, JSON.stringify({ ...lease, expiresAt: Date.now() - 1 }))

  check('expired lease is no longer "held by other"', tabB.isHeldByOther(U) === false)
  const b = tabB.acquire(U)
  check('B steals the expired lease', b.acquired === true, JSON.stringify(b))
  const nowLease = JSON.parse(store.get(key))
  check('B is now the owner', nowLease.tabId !== lease.tabId)
  tabB.release(U)
}

console.log('\n7. Renewal keeps a long replay from self-expiring')
{
  reset()
  tabA.acquire(U)
  const key = [...store.keys()][0]
  const before = JSON.parse(store.get(key)).expiresAt

  // Push the lease close to expiry, then renew.
  store.set(key, JSON.stringify({ ...JSON.parse(store.get(key)), expiresAt: Date.now() + 100 }))
  const renewed = tabA.renew(U)
  const after = JSON.parse(store.get(key)).expiresAt

  check('holder can renew', renewed === true)
  check('expiry pushed out', after > Date.now() + 1000, `after=${after - Date.now()}ms`)
  check('renewal does not change owner', JSON.parse(store.get(key)).tabId === JSON.parse(JSON.stringify(JSON.parse(store.get(key)))).tabId)
  check('non-holder cannot renew', tabB.renew(U) === false)
  check('expiry is bounded by LEASE_MS', after - Date.now() <= tabA.LEASE_MS + 50)
  void before
  tabA.release(U)
}

console.log('\n8. Per-user isolation — one user never blocks another')
{
  reset()
  tabA.acquire(U)
  const other = tabB.acquire(OTHER)
  check('a different user acquires freely', other.acquired === true)
  check('two independent leases coexist', store.size === 2)
  tabB.release(OTHER)
  check("releasing user-2 leaves user-1's lease", store.size === 1)
  tabA.release(U)
}

console.log('\n9. withLock — runs, releases, and stands down when blocked')
{
  reset()
  let ran = 0
  const out = await tabA.withLock(U, async () => { ran++; return 'done' })
  check('runs the callback', ran === 1)
  check('returns its result', out === 'done')
  check('releases afterwards', store.size === 0)

  // Blocked path.
  tabB.acquire(U)
  let ranB = 0
  const blocked = await tabA.withLock(U, async () => { ranB++; return 'should not run' })
  check('does NOT run when another tab holds the lock', ranB === 0)
  check('returns null so the caller can stand down', blocked === null)
  check("other tab's lease untouched", store.size === 1)
  tabB.release(U)
}

console.log('\n10. withLock releases even when the callback throws')
{
  reset()
  let threw = false
  try {
    await tabA.withLock(U, async () => { throw new Error('replay blew up') })
  } catch (e) {
    threw = /replay blew up/.test(e.message)
  }
  check('the error propagates to the caller', threw)
  check('the lock is still released', store.size === 0, JSON.stringify([...store.keys()]))
  check('another tab can proceed', tabB.acquire(U).acquired === true)
  tabB.release(U)
}

console.log('\n11. Degrades safely without storage')
{
  reset()
  const saved = globalThis.localStorage
  delete globalThis.localStorage
  const tabC = await load()
  const r = tabC.acquire(U)
  check('acquires rather than deadlocking when storage is gone', r.acquired === true, JSON.stringify(r))
  check('reports why', r.reason === 'no_storage', r.reason)
  globalThis.localStorage = saved
}

console.log('\n12. Guards')
{
  reset()
  check('no userId -> refused', tabA.acquire(null).acquired === false)
  check('onReleased is a no-op without BroadcastChannel',
    typeof tabA.onReleased(() => {}) === 'function')
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
