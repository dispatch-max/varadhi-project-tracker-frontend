/**
 * Web push subscription flow (browser side).
 *
 * Pairs with the backend that already exists:
 *   GET    /notifications/push/public-key  -> VAPID public key
 *   POST   /notifications/push/subscribe   -> stores { endpoint, keys }
 *   DELETE /notifications/push/subscribe   -> removes it
 *
 * Every function resolves to a result object instead of throwing, so the UI
 * can render a specific reason (unsupported / denied / not configured) rather
 * than a generic failure.
 */

import { notificationsApi } from '@/lib/api/notifications.api'
import { API_BASE_URL } from '@/constants'

const SW_PATH = '/sw.js'

// The service worker isn't bundled, so it can't read NEXT_PUBLIC_API_URL. It
// needs the cross-origin API base to POST inline notification actions, and
// module-scope state set via postMessage is lost whenever the SW is killed —
// so the value travels in the registration URL, which the browser persists.
//
// Scope is derived from the script PATH, not its query, so this is still
// scoped to '/'. getRegistration(SW_PATH) below resolves by scope and is
// unaffected by the query string.
const SW_URL = `${SW_PATH}?api=${encodeURIComponent(API_BASE_URL)}`

export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function getPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission // 'granted' | 'denied' | 'default'
}

// VAPID keys are base64url; PushManager wants a Uint8Array.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i)
  return output
}

async function registerServiceWorker() {
  const existing = await navigator.serviceWorker.getRegistration(SW_PATH)
  // Re-register when an older registration has no (or a stale) api param, so
  // devices that subscribed before Module 2 pick up the action endpoint. The
  // browser treats a changed script URL as a new registration.
  if (existing) {
    const current = existing.active || existing.installing || existing.waiting
    if (current && current.scriptURL.includes(`api=${encodeURIComponent(API_BASE_URL)}`)) {
      return existing
    }
  }
  return navigator.serviceWorker.register(SW_URL)
}

/** Current browser-side subscription for this device, or null. */
export async function getCurrentSubscription() {
  if (!isPushSupported()) return null
  try {
    const registration = await registerServiceWorker()
    await navigator.serviceWorker.ready
    return registration.pushManager.getSubscription()
  } catch {
    return null
  }
}

/**
 * Full opt-in: register SW -> request permission -> fetch VAPID key ->
 * subscribe -> persist to backend.
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
export async function enablePush() {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' }

  try {
    const { publicKey, configured } = await notificationsApi.getPushPublicKey()
    if (!configured || !publicKey) return { ok: false, reason: 'not_configured' }

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return { ok: false, reason: permission } // 'denied' | 'default'

    const registration = await registerServiceWorker()
    await navigator.serviceWorker.ready

    // Reuse an existing subscription if the browser already has one for this
    // service worker — re-subscribing would invalidate the stored endpoint.
    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
    }

    // toJSON() yields exactly { endpoint, expirationTime, keys: { p256dh, auth } },
    // which is the shape the existing subscribe endpoint validates.
    await notificationsApi.subscribeToPush(subscription.toJSON())
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: 'error', error: err?.message }
  }
}

/** Opt out on this device, and drop the row server-side. */
export async function disablePush() {
  if (!isPushSupported()) return { ok: false, reason: 'unsupported' }

  try {
    const subscription = await getCurrentSubscription()
    const endpoint = subscription?.endpoint

    if (subscription) await subscription.unsubscribe()
    // Always tell the backend, even if the browser had already dropped it
    // locally, so no orphaned row keeps receiving sends.
    await notificationsApi.unsubscribeFromPush(endpoint)
    return { ok: true }
  } catch (err) {
    return { ok: false, reason: 'error', error: err?.message }
  }
}
