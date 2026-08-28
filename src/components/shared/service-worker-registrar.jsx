'use client'

import { useEffect } from 'react'

import { API_BASE_URL } from '@/constants'
import { useNotificationStore } from '@/store/notification.store'

/**
 * Global service-worker registration.
 *
 * WHY THIS EXISTS: until now the SW was registered ONLY when a user visited
 * Settings and toggled push (lib/push.js#registerServiceWorker, reachable only
 * from push-notifications.jsx). For the overwhelming majority of sessions no
 * service worker existed at all — which means no background push delivery and,
 * from SF6 onwards, no offline cache either. Mounting this in the provider tree
 * registers it once per session for everyone.
 *
 * IT MUST NOT REQUEST NOTIFICATION PERMISSION. Registration and permission are
 * separate concerns: the business rule is that permission is requested
 * contextually, after a meaningful action, which is what the Settings card
 * does. A page-load permission prompt is exactly the anti-pattern browsers
 * penalise.
 *
 * It also bridges the service worker back to the app: when an inline push
 * action is taken with no tab focused, sw.js posts NOTIFICATION_ACTIONED so an
 * open tab updates immediately instead of waiting out the bell's 30s poll.
 */

// Bump when sw.js changes materially. The browser byte-compares the script and
// will reinstall on any diff, but changing this query param guarantees it —
// and makes "which SW is live" visible in DevTools.
// Keep in step with SW_VERSION inside public/sw.js — that constant names the
// caches, this one busts the registration URL.
const SW_VERSION = 'v1.2.1'
const SW_URL = `/sw.js?api=${encodeURIComponent(API_BASE_URL)}&v=${SW_VERSION}`

export function ServiceWorkerRegistrar() {
  const applyActionResult = useNotificationStore((s) => s.applyActionResult)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    let cancelled = false

    // Registration competes with the app's own first paint and data fetches;
    // defer to after load so it never delays them.
    const register = () => {
      navigator.serviceWorker.register(SW_URL).catch((err) => {
        // Non-fatal: the app works fine without a SW, it just loses push and
        // (from SF6) offline support. Never surface this to the user.
        if (!cancelled) console.warn('[pwa] service worker registration failed:', err.message)
      })
    }

    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })

    // ---- SW -> app bridge -------------------------------------------------
    const onMessage = (event) => {
      const data = event.data
      if (!data || data.type !== 'NOTIFICATION_ACTIONED') return
      if (!data.notificationId || !data.action) return
      // sw.js posts the button's own name (snooze_1h); the server persists
      // every duration as plain 'snooze'. Normalize so the optimistic update
      // matches what the next poll will return.
      const action = String(data.action).startsWith('snooze') ? 'snooze' : data.action
      applyActionResult(
        data.notificationId,
        action,
        data.result ? data.result.actionedAt : undefined
      )
    }

    navigator.serviceWorker.addEventListener('message', onMessage)

    return () => {
      cancelled = true
      window.removeEventListener('load', register)
      navigator.serviceWorker.removeEventListener('message', onMessage)
    }
  }, [applyActionResult])

  return null
}

export default ServiceWorkerRegistrar
