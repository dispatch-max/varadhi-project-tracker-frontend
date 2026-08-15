/*
 * Modules 4 & 5 — integration endpoints must never be served from cache.
 *
 * Drives the REAL public/sw.js the same way sw-cache.test.mjs does, so this
 * answers "can a /calendar or /teams response land in Cache Storage" as a
 * fact rather than by reading the source.
 *
 * Why it matters: a cached /api/calendar/connections response would tell a
 * user their calendar is connected and syncing seconds after they
 * disconnected it, and /api/teams responses describe webhook configuration
 * that must always be read live.
 *
 *   node scripts/integrations-cache.test.mjs
 */
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const SW_PATH = 'c:/Users/USER/Documents/VC Work/varadhi -project-tracker/varadhi-tracker/public/sw.js'
const API_BASE = 'https://api.varadhi.test/api'
const ORIGIN = 'https://app.varadhi.test'

const source = readFileSync(SW_PATH, 'utf8')
const SW_VERSION = source.match(/const SW_VERSION = '([^']+)'/)?.[1]

let pass = 0, fail = 0
const check = (name, cond, extra = '') => {
  if (cond) { pass++; console.log(`  PASS  ${name}`) }
  else { fail++; console.log(`  FAIL  ${name} ${extra}`) }
}

// ---- minimal Cache Storage (mirrors sw-cache.test.mjs) ----------------------
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
    this.headers = new Map(Object.entries(init.headers || {}))
  }
  get ok() { return this.status >= 200 && this.status < 300 }
  clone() { return new FakeResponse(this.body, { status: this.status, type: this.type }) }
  static error() { return new FakeResponse(null, { status: 0, type: 'error' }) }
}

let networkUp = true
async function fakeFetch(request) {
  const url = request.url || String(request)
  if (!networkUp) throw new TypeError('Failed to fetch')
  return new FakeResponse(`body:${url}`, { status: 200, type: url.startsWith(ORIGIN) ? 'basic' : 'cors' })
}

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
vm.runInContext(source, globalScope)

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
console.log('\n0. Version constants stay in step')
{
  check('sw.js declares a version', Boolean(SW_VERSION), String(SW_VERSION))
  const registrar = readFileSync(
    'c:/Users/USER/Documents/VC Work/varadhi -project-tracker/varadhi-tracker/src/components/shared/service-worker-registrar.jsx',
    'utf8'
  )
  const registrarVersion = registrar.match(/const SW_VERSION = '([^']+)'/)?.[1]
  check('the registrar declares the SAME version',
    registrarVersion === SW_VERSION, `sw=${SW_VERSION} registrar=${registrarVersion}`)
}

await fire('install', {})
await fire('activate', {})

console.log('\n1. Calendar endpoints are never cached (Module 4)')
{
  const before = globalScope.caches.all().length
  const urls = [
    `${API_BASE}/calendar/connections`,
    `${API_BASE}/calendar/providers`,
    `${API_BASE}/calendar/events`,
    `${API_BASE}/calendar/conflicts`,
    `${API_BASE}/calendar/connections/abc/settings`,
    `${API_BASE}/calendar`,
  ]
  for (const url of urls) await doFetch(url)

  const stored = globalScope.caches.all().map((s) => s.url)
  check('no /api/calendar response reached Cache Storage',
    !stored.some((u) => /\/calendar/.test(u)),
    JSON.stringify(stored.filter((u) => /calendar/.test(u))))
  check('cache entry count is unchanged',
    globalScope.caches.all().length === before, String(globalScope.caches.all().length))
}

console.log('\n2. Teams endpoints are never cached (Module 5)')
{
  const before = globalScope.caches.all().length
  const urls = [
    `${API_BASE}/teams/webhooks`,
    `${API_BASE}/teams/event-types`,
    `${API_BASE}/teams/webhooks/abc/health`,
    `${API_BASE}/teams`,
  ]
  for (const url of urls) await doFetch(url)

  const stored = globalScope.caches.all().map((s) => s.url)
  check('no /api/teams response reached Cache Storage',
    !stored.some((u) => /\/teams/.test(u)),
    JSON.stringify(stored.filter((u) => /teams/.test(u))))
  check('cache entry count is unchanged',
    globalScope.caches.all().length === before, String(globalScope.caches.all().length))
}

console.log('\n3. Regression — Modules 2/3 exclusions still hold')
{
  const before = globalScope.caches.all().length
  for (const url of [
    `${API_BASE}/auth/me`,
    `${API_BASE}/notifications/push/public-key`,
  ]) await doFetch(url)

  const stored = globalScope.caches.all().map((s) => s.url)
  check('no /api/auth response cached', !stored.some((u) => /\/auth/.test(u)))
  check('no push-subscription response cached', !stored.some((u) => /push/.test(u)))
  check('cache entry count is unchanged', globalScope.caches.all().length === before)
}

console.log('\n4. Ordinary API reads are STILL cached — the exclusion is narrow')
{
  // The guard must not have become a blanket "never cache the API", or
  // Module 3's offline task list would silently stop working.
  await doFetch(`${API_BASE}/tasks`)
  const stored = globalScope.caches.all().map((s) => s.url)
  check('a plain GET /api/tasks IS cached for offline use',
    stored.some((u) => /\/tasks/.test(u)), JSON.stringify(stored))
}

console.log('\n5. Offline behaviour — no stale integration state is served')
{
  networkUp = false
  const res = await doFetch(`${API_BASE}/calendar/connections`)
  // Never a cached 200: it must fail so the UI shows its offline/error state
  // rather than confidently rendering a connection that may no longer exist.
  const servedOk = res && !res.__threw && res.status === 200 && res.type !== 'error'
  check('offline /api/calendar does NOT serve a cached success',
    !servedOk, JSON.stringify({ threw: Boolean(res?.__threw), status: res?.status }))
  networkUp = true
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
