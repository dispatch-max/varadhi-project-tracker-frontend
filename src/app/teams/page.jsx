'use client'

import { useCallback, useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'

import WebhookConfig from '@/components/teams/webhook-config'
import WebhookList from '@/components/teams/webhook-list'
import AdaptiveCardPreview from '@/components/teams/adaptive-card-preview'
import { teamsApi } from '@/lib/api/teams.api'
import { useAuthStore } from '@/store/auth.store'
import { useHasMounted } from '@/hooks/use-has-mounted'

export default function TeamsPage() {
  const mounted = useHasMounted()
  const { user } = useAuthStore()

  const [webhooks, setWebhooks] = useState([])
  const [eventTypes, setEventTypes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  // The backend's restrictTo is the real boundary; this only avoids rendering
  // a form whose every submission would 403.
  const canConfigure = ['admin', 'manager'].includes(user?.role)

  // Derived, not stored: a user who cannot configure never triggers a fetch,
  // so there is nothing to wait for. Computing this instead of calling
  // setIsLoading(false) from the effect avoids a cascading render.
  const showLoading = isLoading && mounted && canConfigure

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
      const [types, list] = await Promise.all([
        teamsApi.getEventTypes(),
        teamsApi.getWebhooks(),
      ])
      setEventTypes(types.eventTypes || [])
      setWebhooks(list.webhooks || [])
    } catch {
      setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!mounted || !canConfigure) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [mounted, canConfigure, load])

  if (!mounted) return null

  if (!canConfigure) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">Microsoft Teams</h2>
        </div>
        <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
          Teams integration is managed by administrators and project managers.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Microsoft Teams</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Receive updates, take action and collaborate with your team without
          leaving Microsoft Teams.
        </p>
      </div>

      {loadError && (
        <p role="status" className="text-sm text-destructive">
          Couldn&apos;t load your Teams integrations.{' '}
          <button type="button" onClick={load} className="underline underline-offset-2">
            Retry
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <WebhookConfig eventTypes={eventTypes} onCreated={load} />
          {showLoading ? (
            <div className="h-40 animate-pulse rounded-xl bg-muted" />
          ) : (
            <WebhookList
              webhooks={webhooks}
              eventTypes={eventTypes}
              onChanged={load}
            />
          )}
        </div>

        <div className="space-y-6">
          <AdaptiveCardPreview />
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-medium text-slate-800">
            Security &amp; authentication
          </p>
          <p className="text-sm text-muted-foreground">
            Webhook URLs are treated as credentials: encrypted at rest, never
            shown again after entry, and never written to logs. Cards carry only
            a task title, project name and a link back to the tracker — anyone
            following that link still has to sign in.
          </p>
        </div>
      </div>
    </div>
  )
}
