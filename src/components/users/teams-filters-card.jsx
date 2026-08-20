'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Users, Shield, User, Mail } from 'lucide-react'
import { usersApi } from '@/lib/api/users.api'

// Each filter maps to a query the /users list already understands, so the
// buttons now actually filter instead of being decorative.
const FILTERS = [
  { key: 'all', label: 'All Members', icon: Users, query: {} },
  { key: 'manager', label: 'Managers', icon: Shield, query: { role: 'manager' } },
  { key: 'employee', label: 'Employees', icon: User, query: { role: 'employee' } },
  { key: 'invited', label: 'Pending Invites', icon: Mail, query: { status: 'invited' } },
]

export function TeamsFiltersCard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [totals, setTotals] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const activeRole = searchParams.get('role')
  const activeStatus = searchParams.get('status')
  const active =
    activeStatus === 'invited'
      ? 'invited'
      : activeRole === 'manager'
        ? 'manager'
        : activeRole === 'employee'
          ? 'employee'
          : 'all'

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const data = await usersApi.getStats()
        if (!cancelled) setTotals(data?.totals ?? null)
      } catch {
        // Counts are supplementary; the filters still work without them.
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const countFor = (key) => {
    if (!totals) return null
    if (key === 'all') return totals.total
    if (key === 'manager') return totals.managers
    if (key === 'employee') return totals.employees
    if (key === 'invited') return totals.invited
    return null
  }

  function applyFilter(filter) {
    const params = new URLSearchParams()
    Object.entries(filter.query).forEach(([k, v]) => params.set(k, v))
    const qs = params.toString()
    router.push(qs ? `/users?${qs}` : '/users')
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-lg font-semibold text-foreground mb-5">Teams &amp; Filters</h3>

      <div className="space-y-1">
        {FILTERS.map((filter) => {
          const Icon = filter.icon
          const isActive = active === filter.key
          const count = countFor(filter.key)

          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => applyFilter(filter)}
              aria-pressed={isActive}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-3 transition ${
                isActive ? 'bg-violet-50 text-violet-700' : 'hover:bg-background'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 ${isActive ? '' : 'text-muted-foreground'}`} />
                <span className={`text-sm ${isActive ? 'font-medium' : 'text-foreground'}`}>
                  {filter.label}
                </span>
              </div>

              {isLoading ? (
                <span className="h-4 w-6 animate-pulse rounded bg-slate-100" />
              ) : (
                <span
                  className={`text-sm ${isActive ? 'font-semibold' : 'text-muted-foreground'}`}
                >
                  {count ?? '—'}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
