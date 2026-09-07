'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Users,
  Shield,
  User,
  Mail,
} from 'lucide-react'

import { usersApi } from '@/lib/api/users.api'

// Each filter maps to a query the /users list already understands.
const FILTERS = [
  {
    key: 'all',
    label: 'All Members',
    icon: Users,
    query: {},
  },
  {
    key: 'manager',
    label: 'Managers',
    icon: Shield,
    query: { role: 'manager' },
  },
  {
    key: 'employee',
    label: 'Employees',
    icon: User,
    query: { role: 'employee' },
  },
  {
    key: 'invited',
    label: 'Pending Invites',
    icon: Mail,
    query: { status: 'invited' },
  },
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

        if (!cancelled) {
          setTotals(data?.totals ?? null)
        }
      } catch {
        // Counts are supplementary;
        // filters still work even if stats fail.
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const countFor = (key) => {
    if (!totals) return null

    if (key === 'all') {
      return totals.total
    }

    if (key === 'manager') {
      return totals.managers
    }

    if (key === 'employee') {
      return totals.employees
    }

    if (key === 'invited') {
      return totals.invited
    }

    return null
  }

  function applyFilter(filter) {
    const params = new URLSearchParams()

    Object.entries(filter.query).forEach(([key, value]) => {
      params.set(key, value)
    })

    const qs = params.toString()

    router.push(
      qs
        ? `/users?${qs}`
        : '/users'
    )
  }

  return (
    <div
      className="
        w-full
        min-w-0
        max-w-full
        overflow-hidden
        rounded-xl
        border
        border-border
        bg-card
        p-4
      "
    >
      {/* HEADER */}
      <h3
        className="
          mb-4
          w-full
          min-w-0
          truncate
          text-base
          font-semibold
          text-foreground
        "
      >
        Teams &amp; Filters
      </h3>

      {/* FILTER LIST */}
      <div className="w-full min-w-0 space-y-1">
        {FILTERS.map((filter) => {
          const Icon = filter.icon
          const isActive =
            active === filter.key

          const count =
            countFor(filter.key)

          return (
            <button
              key={filter.key}
              type="button"
              onClick={() =>
                applyFilter(filter)
              }
              aria-pressed={isActive}
              className={`
                flex
                w-full
                min-w-0
                max-w-full
                items-center
                justify-between
                gap-2
                overflow-hidden
                rounded-lg
                px-2.5
                py-2.5
                text-left
                transition

                ${
                  isActive
                    ? 'bg-violet-50 text-violet-700'
                    : 'hover:bg-background'
                }
              `}
            >
              {/* LEFT SIDE */}
              <div
                className="
                  flex
                  min-w-0
                  flex-1
                  items-center
                  gap-2
                "
              >
                <Icon
                  className={`
                    h-4
                    w-4
                    shrink-0

                    ${
                      isActive
                        ? ''
                        : 'text-muted-foreground'
                    }
                  `}
                />

                <span
                  className={`
                    min-w-0
                    flex-1
                    truncate
                    text-xs

                    ${
                      isActive
                        ? 'font-medium'
                        : 'text-foreground'
                    }
                  `}
                  title={filter.label}
                >
                  {filter.label}
                </span>
              </div>

              {/* COUNT */}
              {isLoading ? (
                <span
                  className="
                    h-4
                    w-5
                    shrink-0
                    animate-pulse
                    rounded
                    bg-slate-100
                  "
                />
              ) : (
                <span
                  className={`
                    shrink-0
                    text-xs

                    ${
                      isActive
                        ? 'font-semibold'
                        : 'text-muted-foreground'
                    }
                  `}
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