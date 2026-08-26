'use client'

import { useState, useEffect } from 'react'
import { dashboardApi } from '@/lib/api/dashboard.api'
import { getInitials, getAvatarColor, cn } from '@/utils'
import { RelativeTime } from '@/components/shared/relative-time'

export function RecentActivity() {
  const [activity, setActivity] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchActivity() {
      try {
        const data = await dashboardApi.getActivity()
        setActivity(data)
      } catch {
        setActivity([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchActivity()
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* FIXED HEADER */}
      <div className="flex h-[30px] shrink-0 items-center border-b border-slate-100 px-3">
        <h3 className="text-[11px] font-semibold text-slate-800">
          Recent Activity
        </h3>
      </div>

      {isLoading ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <p className="text-[9px] text-slate-400">
            Loading...
          </p>
        </div>
      ) : activity.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <p className="text-[9px] text-slate-400">
            No recent activity yet.
          </p>
        </div>
      ) : (
        /* ONLY CONTENT SCROLLS */
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="divide-y divide-slate-100">
            {activity.map((item) => (
              <div
                key={item.id}
                className="flex items-start gap-2 px-3 py-1.5 hover:bg-slate-50"
              >
                <div
                  className={cn(
                    `
                      mt-0.5 flex h-5 w-5
                      shrink-0 items-center justify-center
                      rounded-full text-[7px]
                      font-semibold text-white
                    `,
                    getAvatarColor(item.user.name)
                  )}
                >
                  {getInitials(item.user.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[8px] leading-[1.2] text-slate-600">
                    <span className="font-semibold text-slate-800">
                      {item.user.name}
                    </span>{' '}
                    {item.message}
                  </p>

                  <RelativeTime
                    date={item.createdAt}
                    className="mt-0.5 block text-[7px] text-slate-400"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}