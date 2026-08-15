/*
 * SF6 QA — executes the REAL public/sw.js inside a fake ServiceWorkerGlobalScope
 * and drives its install/activate/fetch handlers against a mock network and a
 * mock Cache Storage.
 *
 * This is the only way to answer "does a non-GET / /api/auth response ever land
 * in Cache Storage" as a fact rather than by reading the source.
 */
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const SW_PATH = 'c:/Users/USER/Documents/VC Work/varadhi -project-tracker/varadhi-tracker/public/sw.js'
const API_BASE = 'https://api.varadhi.test/api'
const ORIGIN = 'https://app.varadhi.test'

// Read the version out of sw.js rather than pinning a literal. These
// assertions are about cache-namespacing behaviour, not about which version
// happens to be current, and a hardcoded string turned every legitimate
// SW_VERSION bump into a spurious failure here.
const SW_VERSION =
  readFileSync(SW_PATH, 'utf8').match(/const SW_VERSION = '([^']+)'/)?.[1]
if (!SW_VERSION) {
  console.error('FAIL  could not read SW_VERSION from sw.js')
  process.exit(1)
}

let pass = 0, fail = 0
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`) }
}

// ---- minimal Cache Storage --------------------------------------------------
class FakeCache {
  constructor(name) { this.name = name; this.entries = new Map() }
  async put(request, response) {
    if (request.method && request.method !== 'GET') throw new TypeError('cache.put non-GET')
    this.entries.set(request.url || String(request), response)
  }
  async add(url) {
    const res = await globalScope.fetch(new FakeRequest(new URL(url, ORIGIN).href))
    if (!res.ok) throw new Error(`add failed ${url}`)
    return this.put(new FakeRequest(new URL(url, ORIGIN).href), res)
  }
  async match(request) { return this.entries.get(request.url || String(request)) }
}
class FakeCacheStorage {
  constructor() { this.caches = new Map() }
  async open(name) {
    if (!this.caches.has(name)) this.caches.set(name, new FakeCache(name))
    return this.caches.get(name)
  }
  async keys() { return [...this.caches.keys()] }
  async delete(name) { return this.caches.delete(name) }
  all() {
    const out = []
    for (const [n, c] of this.caches) for (const url of c.entries.keys()) out.push({ cache: n, url })
    return out
  }
}

class FakeRequest {
  constructor(url, init = {}) {
    const raw = typeof url === 'string' ? url : url.url
    // Browsers resolve a Request URL against the worker's base URL, so
    // new Request('/offline') inside the SW is an ABSOLUTE url. Model that —
    // getting this wrong makes the /offline lookup spuriously miss.
    this.url = new URL(raw, ORIGIN).href
    this.method = init.method || 'GET'
    this.mode = init.mode || 'cors'
  }
}
class FakeResponse {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status ?? 200
    this.type = init.type || 'cors'
    // Mirrors the real Response: true when fetch() followed a redirect, which
    // is how an auth 307 -> /auth/login arrives looking like an ordinary 200.
    this.redirected = init.redirected ?? false
    this.headers = new Map(Object.entries(init.headers || {}))
  }
  get ok() { return this.status >= 200 && this.status < 300 }
  clone() {
    return new FakeResponse(this.body, {
      status: this.status,
      type: this.type,
      redirected: this.redirected,
    })
  }
  static error() { return new FakeResponse(null, { status: 0, type: 'error' }) }
}

// ---- controllable network ---------------------------------------------------
let networkUp = true
let networkLog = []
async function fakeFetch(request) {
  const url = request.url || String(request)
  networkLog.push(url)
  if (!networkUp) throw new TypeError('Failed to fetch')
  return new FakeResponse(`body:${url}`, { status: 200, type: url.startsWith(ORIGIN) ? 'basic' : 'cors' })
}

// ---- global scope -----------------------------------------------------------
const listeners = {}
const globalScope = {
  location: { href: `${ORIGIN}/sw.js?api=${encodeURIComponent(API_BASE)}&v=${SW_VERSION}`, origin: ORIGIN },
  addEventListener: (t, fn) => { (listeners[t] ||= []).push(fn) },
  skipWaiting: () => {},
  clients: { claim: async () => {}, matchAll: async () => [], openWindow: async () => null },
  registration: { showNotification: async () => {} },
  caches: new FakeCacheStorage(),
  fetch: fakeFetch,
  Request: FakeRequest,
  Response: FakeResponse,
  URL, setTimeout, clearTimeout, console, Promise, Error, TypeError, Boolean, Array, JSON, String, Number, Object,
  Notification: { maxActions: 2 },
}
globalScope.self = globalScope

vm.createContext(globalScope)
vm.runInContext(readFileSync(SW_PATH, 'utf8'), globalScope)

// ---- event drivers ----------------------------------------------------------
async function fire(type, event) {
  const waits = []
  event.waitUntil = (p) => waits.push(p)
  let responded = null
  event.respondWith = (p) => { responded = p }
  for (const fn of listeners[type] || []) fn(event)
  await Promise.allSettled(waits)
  return responded ? Promise.resolve(responded).catch((e) => ({ __threw: e })) : null
}
const doFetch = (url, init) => fire('fetch', { request: new FakeRequest(url, init) })

// =============================================================================
console.log('\n1. install — precache')
await fire('install', {})
{
  const stored = globalScope.caches.all()
  const urls = stored.map((s) => s.url.replace(ORIGIN, ''))
  check('precached /offline', urls.includes('/offline'), JSON.stringify(urls))
  check('precached manifest', urls.includes('/manifest.webmanifest'))
  check('precached both main icons',
    urls.includes('/icons/icon-192.png') && urls.includes('/icons/icon-512.png'))
  check('shell cache is version-named', stored.every((s) => /^varadhi-/.test(s.cache)))
}

console.log('\n2. activate — purge of non-current caches')
{
  await globalScope.caches.open('varadhi-shell-v0.9.0')   // stale, ours
  await globalScope.caches.open('varadhi-api-v0.9.0')     // stale, ours
  await globalScope.caches.open('someone-else-v1')        // NOT ours
  await fire('activate', {})
  const keys = await globalScope.caches.keys()
  check('stale varadhi-* caches deleted', !keys.some((k) => k.includes('v0.9.0')), JSON.stringify(keys))
  check('current caches survive', keys.some((k) => k.includes(SW_VERSION)), JSON.stringify(keys))
  check('foreign cache untouched', keys.includes('someone-else-v1'))
}

console.log('\n3. NEVER CACHED — the exclusion contract')
{
  const before = globalScope.caches.all().length
  const forbidden = [
    ['POST', `${API_BASE}/tasks`],
    ['PUT', `${API_BASE}/tasks/1`],
    ['PATCH', `${API_BASE}/tasks/1/status`],
    ['DELETE', `${API_BASE}/tasks/1`],
    ['GET', `${API_BASE}/auth/me`],
    ['POST', `${API_BASE}/auth/login`],
    ['GET', `${API_BASE}/auth`],
    ['GET', `${API_BASE}/notifications/push/public-key`],
    ['POST', `${API_BASE}/notifications/push/subscribe`],
    ['GET', `${API_BASE}/notifications/push`],
  ]
  for (const [method, url] of forbidden) await doFetch(url, { method })

  const stored = globalScope.caches.all().map((s) => s.url)
  check('no non-GET response cached',
    !stored.some((u) => /\/tasks\/1/.test(u)) && before === globalScope.caches.all().length,
    JSON.stringify(stored))
  check('no /api/auth response cached', !stored.some((u) => /\/auth/.test(u)),
    JSON.stringify(stored.filter((u) => /auth/.test(u))))
  check('no /api/notifications/push/* response cached', !stored.some((u) => /push/.test(u)),
    JSON.stringify(stored.filter((u) => /push/.test(u))))
}

console.log('\n4. non-200 and opaque responses are never stored')
{
  const realFetch = globalScope.fetch
  globalScope.fetch = async () => new FakeResponse('nope', { status: 500 })
  await doFetch(`${API_BASE}/tasks?page=9`)
  check('500 not cached', !globalScope.caches.all().some((s) => /page=9/.test(s.url)))

  globalScope.fetch = async () => new FakeResponse(null, { status: 0, type: 'opaque' })
  await doFetch(`${API_BASE}/tasks?page=8`)
  check('opaque not cached', !globalScope.caches.all().some((s) => /page=8/.test(s.url)))

  // A response that came back through a redirect is a 200 whose body belongs
  // to a DIFFERENT url than the one we would file it under. For a navigation
  // this is the auth bounce (/dashboard -> /auth/login): caching it would make
  // an offline /dashboard render the login page to a signed-in user.
  globalScope.fetch = async () =>
    new FakeResponse('<html>login</html>', { status: 200, redirected: true })
  await doFetch(`${API_BASE}/tasks?page=7`)
  check('redirected response not cached',
    !globalScope.caches.all().some((s) => /page=7/.test(s.url)))
  globalScope.fetch = realFetch
}

console.log('\n5. API GETs that SHOULD cache')
{
  for (const p of ['/tasks', '/projects', '/dashboard/stats', '/tasks?page=2']) {
    await doFetch(`${API_BASE}${p}`)
  }
  const stored = globalScope.caches.all().filter((s) => s.cache.includes('api')).map((s) => s.url)
  check('GET /tasks cached', stored.some((u) => u.endsWith('/tasks')))
  check('GET /projects cached', stored.some((u) => u.endsWith('/projects')))
  check('GET /dashboard/* cached', stored.some((u) => /dashboard/.test(u)))
  check('?page=2 is a DISTINCT entry from /tasks (ignoreSearch not used)',
    stored.some((u) => /page=2/.test(u)) && stored.some((u) => u.endsWith('/tasks')))
  check('unlisted API path (/users) not cached', !stored.some((u) => /\/users/.test(u)))
}

console.log('\n6. offline reads — AC-14')
{
  networkUp = false
  const res = await doFetch(`${API_BASE}/tasks`)
  check('cached /tasks served while offline', res && res.body === `body:${API_BASE}/tasks`,
    JSON.stringify(res && res.body))

  // Uncached + offline: networkFirst rejects, which surfaces to the page as a
  // failed fetch — the same thing that would happen with no SW installed. The
  // app's own error handling (and the offline banner) takes over.
  const miss = await doFetch(`${API_BASE}/projects/999`)
  check('uncached API path offline -> rejects, app error handling runs',
    miss && miss.__threw instanceof Error, JSON.stringify(miss))
  networkUp = true
}

console.log('\n7. navigation — network-first -> cache -> /offline')
{
  const online = await doFetch(`${ORIGIN}/tasks`, { mode: 'navigate' })
  check('online navigation returns network', online && online.body === `body:${ORIGIN}/tasks`)

  networkUp = false
  const cached = await doFetch(`${ORIGIN}/tasks`, { mode: 'navigate' })
  check('visited route offline serves cached HTML', cached && cached.body === `body:${ORIGIN}/tasks`)

  const unvisited = await doFetch(`${ORIGIN}/reports`, { mode: 'navigate' })
  check('UNVISITED route offline falls back to /offline',
    unvisited && unvisited.body === `body:${ORIGIN}/offline`,
    JSON.stringify(unvisited && unvisited.body))
  networkUp = true
}

console.log('\n8. static assets — cache-first')
{
  await doFetch(`${ORIGIN}/_next/static/chunks/abc123.js`)
  const n1 = networkLog.length
  await doFetch(`${ORIGIN}/_next/static/chunks/abc123.js`)
  check('second hit served from cache, no network', networkLog.length === n1)

  networkUp = false
  const off = await doFetch(`${ORIGIN}/_next/static/chunks/abc123.js`)
  check('static asset available offline', off && off.body.includes('abc123'))
  networkUp = true
}

console.log('\n9. pass-through — never intercepted')
{
  const r1 = await doFetch('https://fonts.example.com/x.woff2')
  check('unrelated cross-origin passes through', r1 === null)
  const r2 = await doFetch(`${ORIGIN}/api/whatever`)
  check('same-origin non-asset passes through', r2 === null)
  const r3 = await doFetch('chrome-extension://abc/x.js')
  check('non-http scheme passes through', r3 === null)
}

console.log('\n10. version bump purges everything from the old version')
{
  const keysBefore = await globalScope.caches.keys()
  check('all live caches carry the current version',
    keysBefore.filter((k) => k.startsWith('varadhi-')).every((k) => k.includes(SW_VERSION)),
    JSON.stringify(keysBefore))
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
