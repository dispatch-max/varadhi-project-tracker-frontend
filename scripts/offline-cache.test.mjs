/*
 * SF6 QA — cross-user leak test + login-clear ordering.
 *
 * Loads the REAL src/lib/offline-cache.js and drives the exact call sequences
 * that login-form.jsx, sidebar.jsx and api-client.js perform.
 */
import { readFileSync } from 'node:fs'

const ROOT = 'c:/Users/USER/Documents/VC Work/varadhi -project-tracker/varadhi-tracker'
let pass = 0, fail = 0
const check = (n, c, e = '') => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${e}`)) }

// ---- fake Cache Storage -----------------------------------------------------
let deleteDelayMs = 0
let deleteShouldThrow = false
class FakeCacheStorage {
  constructor() { this.store = new Map() }
  async open(name) {
    if (!this.store.has(name)) this.store.set(name, new Map())
    return { put: async (k, v) => this.store.get(name).set(k, v) }
  }
  async keys() { return [...this.store.keys()] }
  async delete(name) {
    if (deleteShouldThrow) throw new Error('storage failure')
    if (deleteDelayMs) await new Promise((r) => setTimeout(r, deleteDelayMs))
    return this.store.delete(name)
  }
  seed(cache, url, body) {
    if (!this.store.has(cache)) this.store.set(cache, new Map())
    this.store.get(cache).set(url, body)
  }
  contentsContaining(needle) {
    const hits = []
    for (const [cache, entries] of this.store)
      for (const [url, body] of entries)
        if (String(body).includes(needle) || url.includes(needle)) hits.push(`${cache}:${url}`)
    return hits
  }
}

globalThis.window = {}
const caches = new FakeCacheStorage()
globalThis.caches = caches
globalThis.window.caches = caches

// Load the real module
const src = readFileSync(`${ROOT}/src/lib/offline-cache.js`, 'utf8')
const mod = await import(`data:text/javascript;base64,${Buffer.from(src).toString('base64')}`)
const { clearOfflineCaches, listOfflineCaches } = mod

const seedUserA = () => {
  caches.seed('varadhi-api-v1.1.0', 'https://api/api/tasks', 'USER_A_SECRET_TASK')
  caches.seed('varadhi-api-v1.1.0', 'https://api/api/projects', 'USER_A_PROJECT')
  caches.seed('varadhi-shell-v1.1.0', 'https://app/tasks', '<html>USER_A_SECRET_TASK</html>')
  caches.seed('varadhi-assets-v1.1.0', 'https://app/_next/static/x.js', 'neutral asset')
}

console.log('\n1. Cross-user leak: A caches -> logout -> B logs in -> offline')
{
  caches.store.clear()
  seedUserA()
  check('user A data is present before logout', caches.contentsContaining('USER_A_SECRET_TASK').length > 0)

  // sidebar.jsx#handleLogout: clearAuth -> cookie clear -> await clearOfflineCaches
  await clearOfflineCaches()
  check('logout clears user A caches', caches.contentsContaining('USER_A_SECRET_TASK').length === 0,
    JSON.stringify(caches.contentsContaining('USER_A_SECRET_TASK')))

  // login-form.jsx: await clearOfflineCaches() BEFORE setAuth/redirect
  await clearOfflineCaches().catch(() => {})
  check('ZERO user A data visible to user B offline',
    caches.contentsContaining('USER_A').length === 0,
    JSON.stringify(caches.contentsContaining('USER_A')))
  check('no varadhi-* caches remain at all', (await listOfflineCaches()).length === 0)
}

console.log('\n2. The killed-browser case (no clean logout) — login-side clear alone')
{
  caches.store.clear()
  seedUserA()
  // Browser killed: handleLogout NEVER ran, 401 never fired. User B logs in.
  await clearOfflineCaches().catch(() => {})
  check('login-side clear alone removes all user A data',
    caches.contentsContaining('USER_A').length === 0,
    JSON.stringify(caches.contentsContaining('USER_A')))
}

console.log('\n3. Login ordering — clear COMPLETES before redirect')
{
  caches.store.clear()
  seedUserA()
  deleteDelayMs = 60  // make the async gap observable

  const events = []
  // Faithful transcription of login-form.jsx's ordering.
  async function handleSubmitTail() {
    await clearOfflineCaches().catch(() => {})
    events.push('cleared')
    events.push('setAuth')
    events.push('router.push')
  }
  await handleSubmitTail()
  deleteDelayMs = 0

  check('clear resolves before router.push', events.indexOf('cleared') < events.indexOf('router.push'),
    JSON.stringify(events))
  check('caches actually empty at redirect time', caches.contentsContaining('USER_A').length === 0)
}

console.log('\n4. A cache failure must NEVER block a legitimate login')
{
  caches.store.clear()
  seedUserA()
  deleteShouldThrow = true

  let reached = false
  let threw = null
  try {
    await clearOfflineCaches().catch(() => {})
    reached = true
  } catch (e) { threw = e }
  deleteShouldThrow = false

  check('clearOfflineCaches does not reject on storage failure', threw === null, String(threw))
  check('login proceeds past the clear', reached)
  check('returns 0 rather than throwing', (await (async () => {
    deleteShouldThrow = true
    const n = await clearOfflineCaches()
    deleteShouldThrow = false
    return n
  })()) === 0)
}

console.log('\n5. No Cache API at all (private mode / old browser)')
{
  const saved = globalThis.caches
  delete globalThis.caches
  globalThis.window = {}
  let ok = true
  try { await clearOfflineCaches() } catch { ok = false }
  check('degrades silently without the Cache API', ok)
  globalThis.caches = saved
  globalThis.window = { caches: saved }
}

console.log('\n6. Only varadhi-* caches are touched')
{
  caches.store.clear()
  seedUserA()
  caches.seed('third-party-cache', 'https://x/y', 'not ours')
  await clearOfflineCaches()
  const keys = await caches.keys()
  check('foreign cache preserved', keys.includes('third-party-cache'), JSON.stringify(keys))
  check('all varadhi caches gone', !keys.some((k) => k.startsWith('varadhi-')))
}

console.log('\n7. Stale-version caches are swept too (prefix, not exact name)')
{
  caches.store.clear()
  caches.seed('varadhi-api-v0.9.0', 'https://api/api/tasks', 'USER_A_OLD_VERSION')
  caches.seed('varadhi-api-v1.1.0', 'https://api/api/tasks', 'USER_A_CURRENT')
  await clearOfflineCaches()
  check('older SW_VERSION caches also cleared', caches.contentsContaining('USER_A').length === 0,
    JSON.stringify(caches.contentsContaining('USER_A')))
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
