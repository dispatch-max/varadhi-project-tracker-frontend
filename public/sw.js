/*
 * Varadhi Tracker — push service worker
 *
 * Consumes the payload notification-engine.js#sendPush produces:
 *   { title, body, url, type, priority, notificationId, icon, badge,
 *     actions?, actionToken? }
 *
 * Served from /sw.js so its scope covers the whole app.
 *
 * The API base arrives in the registration query string (see lib/push.js):
 * this file isn't bundled so it can't read NEXT_PUBLIC_API_URL, and module
 * state set via postMessage would be lost every time the SW is killed. The
 * registration URL is persisted by the browser, so it survives restarts.
 */

const API_BASE = new URL(self.location.href).searchParams.get('api') || ''

/* ───────────────────────── caching (SF6) ─────────────────────────
 *
 * Bump SW_VERSION on any material change to this file. The browser byte-
 * compares /sw.js on navigation and reinstalls on any diff, so the constant
 * changing IS the invalidation trigger — which is why next.config.mjs serves
 * this file with `max-age=0, must-revalidate`. A CDN pinning a stale copy would
 * strand users on an old worker with no way to recover.
 *
 * Three caches, all prefixed `varadhi-` so lib/offline-cache.js can find and
 * delete them wholesale on logout/401/login, whatever version they carry.
 */
const SW_VERSION = 'v1.2.1'
const CACHE_PREFIX = 'varadhi-'
const SHELL_CACHE = `${CACHE_PREFIX}shell-${SW_VERSION}`
const ASSET_CACHE = `${CACHE_PREFIX}assets-${SW_VERSION}`
const API_CACHE = `${CACHE_PREFIX}api-${SW_VERSION}`
const CURRENT_CACHES = [SHELL_CACHE, ASSET_CACHE, API_CACHE]

const OFFLINE_URL = '/offline'

// Only stable, unhashed URLs belong here. Hashed /_next/static/* names change
// every build and aren't knowable without a build-time manifest — they're
// picked up by runtime cache-first instead, which is equivalent for immutable
// content-hashed files.
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// API paths that must never be written to the cache, matched against pathname.
// /auth carries credentials and login/logout responses; a cached 200 there is
// both a leak and a correctness bug. The push endpoints manage subscription
// state that is meaningless when replayed.
// Integration endpoints join auth and push subscriptions here (Modules 4 & 5).
// A stale /calendar response would tell a user their calendar is connected and
// synced when they just disconnected it, and /teams responses describe webhook
// state that must never be answered from a cache. Both are also the endpoints
// most likely to carry integration credentials in a request body.
const NEVER_CACHE_PATTERNS = [
  /\/auth(\/|$)/,
  /\/notifications\/push(\/|$)/,
  /\/calendar(\/|$)/,
  /\/teams(\/|$)/,
]

// Navigation timeout exists only to stop a *hung* socket from hanging the tab
// forever — it is not a performance budget. It must therefore sit well above
// the slowest legitimate server response, or it converts a slow-but-working
// navigation into a failure.
//
// In `next dev` Turbopack compiles each route on its first request, which
// routinely takes several seconds — measured >3s for a cold route here. The
// previous 3s ceiling raced that compile: the SW aborted the real navigation
// and fell back to a cache that is empty on a first visit, so the browser got
// nothing and showed "This page couldn't load."
//
// Production responses are far below either number; this only changes how long
// we wait before giving up on a network that is genuinely not answering.
const NAVIGATE_TIMEOUT_MS = 30000
const API_TIMEOUT_MS = 4000

self.addEventListener('install', (event) => {
  // Precache failures must not abort the install — a single 404 would leave the
  // worker permanently uninstalled and take push down with it. Each URL is
  // added individually so one bad entry can't poison the rest.
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url)))
    )
  )
  // Take over without waiting for existing tabs to close.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Purge every Varadhi cache that isn't part of this version. Scoped to
      // our own prefix so we never delete a cache belonging to something else
      // on the same origin.
      const keys = await caches.keys()
      await Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
      await self.clients.claim()
    })()
  )
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload = {}
  try {
    payload = event.data.json()
  } catch {
    // Fall back to plain text if something ever sends a non-JSON body.
    payload = { title: 'Varadhi Tracker', body: event.data.text() }
  }

  const title = payload.title || 'Varadhi Tracker'
  const options = {
    body: payload.body || '',
    // Unique per notification so distinct alerts don't collapse into one.
    tag: payload.notificationId || undefined,
    icon: payload.icon || undefined,
    badge: payload.badge || undefined,
    // Everything notificationclick needs, including the credential — the SW
    // has no other way to authenticate against the cross-origin API.
    data: {
      url: payload.url || '/',
      notificationId: payload.notificationId || null,
      actionToken: payload.actionToken || null,
      type: payload.type || null,
    },
    // Escalations stay on screen until acknowledged.
    requireInteraction: payload.priority === 'urgent',
  }

  // maxActions is 2 on Chrome/Android and 0 on iOS Safari. Note the explicit
  // number check rather than `|| 2`: maxActions === 0 is falsy, so a default
  // would put buttons back on exactly the platform that can't render them.
  // Where actions are unsupported the notification still shows and the body
  // tap still deep-links — the feature degrades, it doesn't disappear.
  const maxActions =
    typeof Notification !== 'undefined' && typeof Notification.maxActions === 'number'
      ? Notification.maxActions
      : 2
  if (Array.isArray(payload.actions) && payload.actions.length > 0 && maxActions > 0) {
    options.actions = payload.actions.slice(0, maxActions)
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  const data = event.notification.data || {}
  const targetUrl = data.url || '/'

  event.notification.close()

  // Body tap (no action button) — behave exactly as before.
  if (!event.action) {
    event.waitUntil(openApp(targetUrl))
    return
  }

  event.waitUntil(handleAction(event.action, data, targetUrl))
})

/**
 * Perform an inline action against the backend without opening the app.
 *
 * Falls back to deep-linking whenever the action cannot be completed
 * unattended — an expired token, a permission change since the push was sent,
 * or no network. The user always ends up somewhere useful rather than tapping
 * a button that silently does nothing.
 */
async function handleAction(action, data, targetUrl) {
  // Snooze means "not now". If it can't be recorded we still must not yank the
  // user into the app — that is the opposite of what they asked for. Closing
  // the notification (already done by the caller) is the honest fallback: the
  // item stays unactioned and in the in-app centre.
  const isSnooze = typeof action === 'string' && action.startsWith('snooze')

  if (!API_BASE || !data.actionToken) {
    return isSnooze ? undefined : openApp(withIntent(targetUrl, action))
  }

  try {
    const res = await fetch(`${API_BASE}/notification-actions`, {
      method: 'POST',
      // Only Content-Type is on the server's CORS allowlist — adding a custom
      // header here would fail preflight, so the credential goes in the body.
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: data.actionToken,
        action,
        source: 'push',
      }),
    })

    if (res.ok) {
      const body = await res.json().catch(() => null)
      const result = body && body.data ? body.data : null
      await notifyClients({
        type: 'NOTIFICATION_ACTIONED',
        notificationId: data.notificationId,
        action,
        result,
      })
      return
    }

    // 401 (expired/invalid token) and 403 (permission changed since send) both
    // mean "can't do this unattended" — open the app so the user can finish
    // the job with a real session. This is the stale-token mitigation.
    if (res.status === 401 || res.status === 403) {
      return isSnooze ? undefined : openApp(withIntent(targetUrl, action))
    }

    // 409 conflict / 429 rate-limited / 5xx: the in-app notification centre
    // shows the real state, so send them there rather than guessing.
    return isSnooze ? undefined : openApp(targetUrl)
  } catch {
    // Offline or the request never landed.
    return isSnooze ? undefined : openApp(withIntent(targetUrl, action))
  }
}

/** Adds ?intent=<action> so the app can pre-select the action on arrival. */
function withIntent(url, action) {
  if (!action) return url
  return url.includes('?') ? `${url}&intent=${action}` : `${url}?intent=${action}`
}

/**
 * Tell any open tab an action landed, so the bell updates immediately instead
 * of waiting out its 30-second poll.
 */
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
  clients.forEach((client) => {
    try {
      client.postMessage(message)
    } catch {
      /* a client can go away mid-iteration; nothing to do */
    }
  })
}

/* ───────────────────────── fetch strategies (SF6) ─────────────────────────
 *
 * | Request                                   | Strategy                      |
 * |-------------------------------------------|-------------------------------|
 * | mode === 'navigate'                        | network-first 3s -> cache -> /offline |
 * | same-origin /_next/static, /icons, *.svg   | cache-first (immutable)       |
 * | same-origin /_next/image                   | stale-while-revalidate        |
 * | cross-origin API GET tasks/projects/dash   | network-first 4s -> cache     |
 * | everything else                            | pass through, never cached    |
 *
 * Anything not explicitly matched is left entirely alone — no respondWith, so
 * the browser handles it exactly as if no service worker existed.
 */

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Non-GET is never cacheable (cache.put() rejects it outright) and must never
  // be intercepted — replaying a POST would be a correctness disaster.
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }

  // Only http(s). Skips chrome-extension:// and similar, which throw on put().
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigate(request))
    return
  }

  const sameOrigin = url.origin === self.location.origin

  if (sameOrigin) {
    if (isImmutableAsset(url)) {
      event.respondWith(cacheFirst(request, ASSET_CACHE))
      return
    }
    if (url.pathname.startsWith('/_next/image')) {
      event.respondWith(staleWhileRevalidate(request, ASSET_CACHE))
      return
    }
    // Everything else same-origin (RSC payloads, /api routes) falls through.
    return
  }

  if (isCacheableApiRequest(url)) {
    event.respondWith(networkFirst(request, API_CACHE, API_TIMEOUT_MS))
  }
  // All other cross-origin traffic passes straight through.
})

/** Content-hashed or otherwise immutable same-origin assets. */
function isImmutableAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.svg')
  )
}

/** Read-only API collections worth having offline. */
function isCacheableApiRequest(url) {
  if (!API_BASE) return false

  let base
  try {
    base = new URL(API_BASE)
  } catch {
    return false
  }
  if (url.origin !== base.origin) return false
  if (!url.pathname.startsWith(base.pathname)) return false

  const rest = url.pathname.slice(base.pathname.length)
  if (NEVER_CACHE_PATTERNS.some((re) => re.test(rest))) return false

  return /^\/(tasks|projects|dashboard)(\/|$|\?)/.test(rest)
}

/**
 * Only ever store a response we are confident is complete, successful, and
 * readable. `type === 'opaque'` shouldn't occur (we never use mode:'no-cors')
 * but is rejected anyway: an opaque response has status 0 and an unreadable
 * body, so caching one would serve an indistinguishable-from-success blank.
 */
function isCacheable(response) {
  if (!response) return false
  if (response.status !== 200) return false
  if (response.type === 'opaque') return false
  // `fetch()` follows redirects by default and reports the *final* response,
  // so a 307 -> /auth/login lands here as a perfectly ordinary 200 whose body
  // is the login page. Caching that under the originally-requested key (e.g.
  // /dashboard) would serve the login page to an authenticated user the next
  // time that route was answered from cache. `redirected` is the only thing
  // distinguishing the two, so it must gate the write.
  if (response.redirected) return false
  return true
}

/** Store a clone, swallowing quota and put() errors. */
async function putInCache(cacheName, request, response) {
  if (!isCacheable(response)) return
  if (request.method !== 'GET') return
  try {
    const cache = await caches.open(cacheName)
    await cache.put(request, response.clone())
  } catch {
    /* quota exceeded or a non-storable request — caching is best-effort */
  }
}

/**
 * Read from cache, ignoring Vary. The `cors` package sets `Vary: Origin` on
 * every API response, which would otherwise make matches miss. Search params
 * are NOT ignored, so ?page=2 stays a distinct entry from ?page=1.
 */
function matchInCache(cacheName, request) {
  return caches.open(cacheName).then((cache) => cache.match(request, { ignoreVary: true }))
}

/** Reject after `ms` so a hung socket falls back instead of hanging forever. */
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      }
    )
  })
}

/** Navigation: fresh HTML when possible, last-known when not, /offline as the floor. */
async function handleNavigate(request) {
  try {
    const response = await withTimeout(fetch(request), NAVIGATE_TIMEOUT_MS)
    // Cache successful navigations so a previously-visited route survives
    // going offline.
    await putInCache(SHELL_CACHE, request, response)
    return response
  } catch {
    const cached = await matchInCache(SHELL_CACHE, request)
    if (cached) return cached

    const offline = await matchInCache(SHELL_CACHE, new Request(OFFLINE_URL))
    if (offline) return offline

    // Precache missed and nothing is stored — better a clear message than a
    // browser error page.
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>Offline</title>' +
        '<body style="font-family:system-ui;padding:2rem;text-align:center">' +
        '<h1>You&rsquo;re offline</h1><p>Reconnect and try again.</p>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}

/** Immutable assets: cache wins, network only fills the gap. */
async function cacheFirst(request, cacheName) {
  const cached = await matchInCache(cacheName, request)
  if (cached) return cached

  const response = await fetch(request)
  await putInCache(cacheName, request, response)
  return response
}

/** Serve stale immediately, refresh in the background. */
async function staleWhileRevalidate(request, cacheName) {
  const cached = await matchInCache(cacheName, request)

  const network = fetch(request)
    .then(async (response) => {
      await putInCache(cacheName, request, response)
      return response
    })
    .catch(() => null)

  if (cached) return cached

  const response = await network
  return response || Response.error()
}

/** API reads: fresh when the network allows, cached when it doesn't. */
async function networkFirst(request, cacheName, timeoutMs) {
  try {
    const response = await withTimeout(fetch(request), timeoutMs)
    await putInCache(cacheName, request, response)
    return response
  } catch {
    const cached = await matchInCache(cacheName, request)
    if (cached) return cached
    // No cached copy: let the caller's own error handling run, same as if no
    // service worker were installed.
    throw new Error('offline and no cached response')
  }
}

/** Reuse an already-open tab on the same origin instead of piling up windows. */
async function openApp(targetUrl) {
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

  for (const client of clientList) {
    if ('focus' in client && client.url === targetUrl) return client.focus()
  }
  for (const client of clientList) {
    if ('navigate' in client && 'focus' in client) {
      const navigated = await client.navigate(targetUrl).catch(() => null)
      return navigated ? navigated.focus() : client.focus()
    }
  }
  if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
  return null
}
