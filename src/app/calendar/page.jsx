'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, ShieldCheck, TriangleAlert } from 'lucide-react'

import ConnectCalendars from '@/components/calendar/connect-calendars'
import SyncSettings from '@/components/calendar/sync-settings'
import SyncStatusPanel from '@/components/calendar/sync-status-panel'
import SupportedSyncItems from '@/components/calendar/supported-sync-items'
import ConflictResolution from '@/components/calendar/conflict-resolution'
import CalendarPreview from '@/components/calendar/calendar-preview'
import { calendarApi } from '@/lib/api/calendar.api'

/**
 * Human wording for the ?status=&detail= the OAuth callback redirects back
 * with. The raw codes are diagnostic, not user-facing.
 */
function callbackMessage(status, detail) {
  if (!status) return null
  if (status === 'connected') {
    return {
      type: 'success',
      text: `${detail === 'outlook' ? 'Outlook' : 'Google'} Calendar connected. Your first sync runs within 5 minutes.`,
    }
  }
  if (status === 'denied') {
    return { type: 'error', text: 'Authorisation was cancelled, so nothing was connected.' }
  }
  const reasons = {
    state_expired: 'The authorisation link expired. Try connecting again.',
    state_invalid: 'That authorisation could not be verified. Try connecting again.',
    state_mismatch: 'That authorisation could not be verified. Try connecting again.',
    encryption_unavailable:
      'The server has no encryption key configured, so the connection was not saved. Contact your administrator.',
    exchange_failed: 'The calendar provider rejected the authorisation. Try again.',
  }
  return { type: 'error', text: reasons[detail] || 'Connecting the calendar failed. Try again.' }
}

/**
 * useSearchParams() opts a route into client-side rendering and Next requires
 * it to sit under a Suspense boundary, so the OAuth-result banner is read in
 * an inner component while the page shell stays statically renderable.
 */
export default function CalendarPage() {
  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <CalendarPageInner />
    </Suspense>
  )
}

function CalendarSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Calendar Sync</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Seamlessly sync your tasks, due dates, meetings and milestones with
          Google Calendar and Outlook Calendar.
        </p>
      </div>
      <div className="h-40 animate-pulse rounded-xl bg-muted" />
    </div>
  )
}

function CalendarPageInner() {
  const searchParams = useSearchParams()

  const [providers, setProviders] = useState([])
  const [connections, setConnections] = useState([])
  const [conflicts, setConflicts] = useState([])
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [banner, setBanner] = useState(() =>
    callbackMessage(searchParams.get('status'), searchParams.get('detail'))
  )

  const load = useCallback(async () => {
    setIsLoading(true)
    setLoadError(false)
    try {
      // Parallel: these four are independent, and serialising them would make
      // the page visibly slower for no benefit.
      const [providerData, connectionData, conflictData, eventData] = await Promise.all([
        calendarApi.getProviders(),
        calendarApi.getConnections(),
        calendarApi.getConflicts(),
        calendarApi.getUpcomingEvents({ limit: 20, days: 14 }),
      ])
      setProviders(providerData.providers || [])
      setConnections(connectionData.connections || [])
      setConflicts(conflictData.conflicts || [])
      setEvents(eventData.events || [])
    } catch {
      setLoadError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Calendar Sync</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Seamlessly sync your tasks, due dates, meetings and milestones with
          Google Calendar and Outlook Calendar.
        </p>
      </div>

      {banner && (
        <div
          role="status"
          className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
            banner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-600'
          }`}
        >
          {banner.type === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span className="flex-1">{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="shrink-0 text-xs underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {loadError && (
        <p role="status" className="text-sm text-destructive">
          Couldn&apos;t load your calendar settings.{' '}
          <button type="button" onClick={load} className="underline underline-offset-2">
            Retry
          </button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ConnectCalendars
            providers={providers}
            connections={connections}
            onChanged={load}
          />
          <SupportedSyncItems connections={connections} />
          <ConflictResolution conflicts={conflicts} onResolved={load} />
        </div>

        <div className="space-y-6">
          <SyncSettings connections={connections} onSaved={load} />
          <SyncStatusPanel connections={connections} onSynced={load} />
          <CalendarPreview events={events} isLoading={isLoading} />
        </div>
      </div>

      {/* The reference design's "Secure & Private" footer. Kept because it
          states something true and load-bearing about this feature: tokens are
          encrypted at rest and only mapped fields ever leave the tracker. */}
      <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-medium text-slate-800">Secure &amp; private</p>
          <p className="text-sm text-muted-foreground">
            Access tokens are encrypted at rest and never shown again after
            authorisation. Only the task title, due date, description and a link
            back to the tracker are ever written to your calendar.
          </p>
        </div>
      </div>
    </div>
  )
}
