'use client'

import { useCallback, useEffect, useState } from 'react'
import { Download, Share, X, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useHasMounted } from '@/hooks/use-has-mounted'
import { cn } from '@/utils'

/**
 * "Install app" affordance.
 *
 * Chrome/Edge/Android fire `beforeinstallprompt`, which we capture and replay
 * on click. iOS Safari has no such event and no programmatic install, so it
 * gets short manual instructions instead — the alternative is showing nothing
 * at all on the platform where discoverability is worst.
 *
 * Hidden entirely once the app is already installed, and dismissible for the
 * rest of the session so it never becomes nagware.
 */

const DISMISS_KEY = 'varadhi_install_dismissed'

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari's non-standard flag for home-screen launches.
    window.navigator.standalone === true
  )
}

function isIos() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  return /iphone|ipad|ipod/i.test(ua) && !/crios|fxios/i.test(ua)
}

export function InstallPrompt({ className }) {
  const mounted = useHasMounted()
  const [deferred, setDeferred] = useState(null)
  const [showIosHelp, setShowIosHelp] = useState(false)

  // Lazy initialisers rather than setState-in-effect: these read browser APIs
  // that are stable at mount, so there is nothing to synchronise afterwards.
  // The `useHasMounted` gate below keeps SSR and the first client render
  // consistent, so reading them here can't cause a hydration mismatch.
  const [installed, setInstalled] = useState(() => isStandalone())
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    const onBeforeInstall = (e) => {
      // Suppress Chrome's own mini-infobar so the app controls placement.
      e.preventDefault()
      setDeferred(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)

    // display-mode flips without a reload when the user installs from the
    // browser's own menu rather than our button.
    const mq = window.matchMedia?.('(display-mode: standalone)')
    const onModeChange = (e) => setInstalled(e.matches)
    mq?.addEventListener?.('change', onModeChange)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
      mq?.removeEventListener?.('change', onModeChange)
    }
  }, [])

  const dismiss = useCallback(() => {
    setDismissed(true)
    setShowIosHelp(false)
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* private mode — dismissal just won't persist */
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferred) return
    deferred.prompt()
    const choice = await deferred.userChoice.catch(() => null)
    // The event is single-use whatever the outcome.
    setDeferred(null)
    if (choice?.outcome === 'accepted') setInstalled(true)
  }, [deferred])

  // Gate on mount: installed/dismissed state comes from browser APIs that
  // don't exist during SSR, so rendering before mount would mismatch.
  if (!mounted || installed || dismissed) return null

  const ios = isIos()
  if (!deferred && !ios) return null

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3',
        className
      )}
    >
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white">
        <Download className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">Install Varadhi</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Add it to your {ios ? 'home screen' : 'desktop'} for faster access and
          notifications while the app is closed.
        </p>

        {showIosHelp && (
          <ol className="mt-2 space-y-1 text-xs text-slate-600">
            <li className="flex items-center gap-1.5">
              <Share className="h-3 w-3 shrink-0 text-violet-600" />
              Tap the Share button in Safari&apos;s toolbar
            </li>
            <li className="flex items-center gap-1.5">
              <Plus className="h-3 w-3 shrink-0 text-violet-600" />
              Choose &ldquo;Add to Home Screen&rdquo;
            </li>
          </ol>
        )}

        <div className="mt-2 flex items-center gap-2">
          {ios ? (
            <Button size="xs" onClick={() => setShowIosHelp((v) => !v)}>
              {showIosHelp ? 'Hide steps' : 'How to install'}
            </Button>
          ) : (
            <Button size="xs" onClick={install}>
              <Download />
              Install
            </Button>
          )}
          <Button size="xs" variant="ghost" onClick={dismiss}>
            Not now
          </Button>
        </div>
      </div>

      <button
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="text-slate-400 transition-colors hover:text-slate-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

export default InstallPrompt
