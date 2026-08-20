/*
 * SF6 QA — SW_VERSION bump: old caches must be deleted after reload.
 *
 * Loads the real sw.js TWICE in separate contexts, the second with SW_VERSION
 * rewritten, sharing one Cache Storage — exactly what a version bump does.
 */
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const SW_PATH = 'c:/Users/USER/Documents/VC Work/varadhi -project-tracker/varadhi-tracker/public/sw.js'
const API_BASE = 'https://api.varadhi.test/api'
const ORIGIN = 'https://app.varadhi.test'
const source = readFileSync(SW_PATH, 'utf8')

// Read the CURRENT version out of the file rather than hardcoding it. This
// test is about the eviction mechanism, not about any particular version
// string — pinning a literal made every legitimate SW_VERSION bump fail this
// test, which trains people to edit the test instead of reading the failure.
const CURRENT = source.match(/const SW_VERSION = '([^']+)'/)?.[1]
if (!CURRENT) {
  console.error('FAIL  could not read SW_VERSION from sw.js')
  process.exit(1)
}
// A synthetic "next" version; never equal to CURRENT whatever CURRENT is.
const NEXT = `${CURRENT}-next`

let pass = 0, fail = 0
const check = (n, c, e = '') => { c ? (pass++, console.log(`  PASS  ${n}`)) : (fail++, console.log(`  FAIL  ${n} ${e}`)) }

class FakeCacheStorage {
  constructor() { this.store = new Map() }
  async open(name) {
    if (!this.store.has(name)) this.store.set(name, new Map())
    const m = this.store.get(name)
    return {
      put: async (req, res) => m.set(req.url || String(req), res),
      add: async (url) => m.set(new URL(url, ORIGIN).href, 'precached'),
      match: async (req) => m.get(req.url || String(req)),
    }
  }
  async keys() { return [...this.store.keys()] }
  async delete(n) { return this.store.delete(n) }
}

const sharedCaches = new FakeCacheStorage()

function bootSW(src) {
  const listeners = {}
  const g = {
    location: { href: `${ORIGIN}/sw.js?api=${encodeURIComponent(API_BASE)}`, origin: ORIGIN },
    addEventListener: (t, fn) => { (listeners[t] ||= []).push(fn) },
    skipWaiting: () => {},
    clients: { claim: async () => {}, matchAll: async () => [] },
    registration: { showNotification: async () => {} },
    caches: sharedCaches,
    fetch: async (r) => ({ status: 200, type: 'cors', ok: true, clone: () => ({}), url: r.url }),
    Request: class { constructor(u, i = {}) { this.url = new URL(typeof u === 'string' ? u : u.url, ORIGIN).href; this.method = i.method || 'GET'; this.mode = i.mode || 'cors' } },
    Response: class {},
    URL, setTimeout, clearTimeout, console, Promise, Error, TypeError, Boolean, Array, JSON, String, Number, Object,
    Notification: { maxActions: 2 },
  }
  g.self = g
  vm.createContext(g)
  vm.runInContext(src, g)
  return { g, listeners }
}

async function fire(listeners, type, event = {}) {
  const waits = []
  event.waitUntil = (p) => waits.push(p)
  event.respondWith = () => {}
  for (const fn of listeners[type] || []) fn(event)
  await Promise.allSettled(waits)
}

console.log('\nSW_VERSION bump — two reloads')

// --- Reload 1: current version installs and populates caches ---
const v1 = bootSW(source)
await fire(v1.listeners, 'install')
await fire(v1.listeners, 'activate')
// simulate some runtime caching
;(await sharedCaches.open(`varadhi-api-${CURRENT}`)).put({ url: `${API_BASE}/tasks` }, 'data')
;(await sharedCaches.open(`varadhi-assets-${CURRENT}`)).put({ url: `${ORIGIN}/_next/static/a.js` }, 'js')

const afterV1 = await sharedCaches.keys()
console.log(`  ${CURRENT} caches: ${JSON.stringify(afterV1)}`)
check(`${CURRENT} created its three caches`,
  afterV1.filter((k) => k.includes(CURRENT)).length === 3, JSON.stringify(afterV1))

// --- Reload 2: SW_VERSION bumped, same Cache Storage ---
const bumped = source.replace(
  `const SW_VERSION = '${CURRENT}'`,
  `const SW_VERSION = '${NEXT}'`
)
check('harness actually bumped the constant', bumped !== source)

const v2 = bootSW(bumped)
await fire(v2.listeners, 'install')
await fire(v2.listeners, 'activate')

const afterV2 = await sharedCaches.keys()
console.log(`  after bump:    ${JSON.stringify(afterV2)}`)
// `NEXT` contains `CURRENT` as a prefix, so an exact-suffix match is required
// to tell "the old cache survived" from "the new cache merely looks similar".
check(`ALL ${CURRENT} caches deleted`,
  !afterV2.some((k) => k.endsWith(`-${CURRENT}`)), JSON.stringify(afterV2))
check(`${NEXT} caches present`, afterV2.some((k) => k.endsWith(`-${NEXT}`)))
check('no cache accumulation across versions',
  afterV2.filter((k) => k.startsWith('varadhi-')).length <= 3, JSON.stringify(afterV2))

// --- Reload 3: idempotent, nothing further deleted ---
const v3 = bootSW(bumped)
await fire(v3.listeners, 'install')
await fire(v3.listeners, 'activate')
const afterV3 = await sharedCaches.keys()
check('second reload at same version is stable',
  JSON.stringify(afterV3.sort()) === JSON.stringify(afterV2.sort()), JSON.stringify(afterV3))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
