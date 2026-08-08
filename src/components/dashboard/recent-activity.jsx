'use client'

import { useState, useEffect } from 'react'
import { dashboardApi } from '@/lib/api/dashboard.api'
import { getInitials, getAvatarColor, cn } from '@/utils'
import { formatDistanceToNow, parseISO } from 'date-fns'

function RelativeTime({ dateString }) {
  const [label, setLabel] = useState('')

  useEffect(() => {
    setLabel(
      formatDistanceToNow(parseISO(dateString), { addSuffix: true })
    )
  }, [dateString])

  if (!label) return null
  return <p className="text-xs text-slate-400 mt-0.5">{label}</p>
}

// Skeleton loader
function ActivitySkeleton() {
  return (
    <div className="flex items-start gap-3 animate-pulse">
      <div className="w-7 h-7 rounded-full bg-slate-100 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="h-3 bg-slate-100 rounded w-full mb-1.5" />
        <div className="h-3 bg-slate-100 rounded w-20" />
      </div>
    </div>
  )
}

export function RecentActivity() {
  const [activity, setActivity] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchActivity() {
      try {
        const data = await dashboardApi.getActivity()
        setActivity(data)
      } catch (err) {
        setActivity([])
      } finally {
        setIsLoading(false)
      }
    }
    fetchActivity()
  }, [])

  return (
    <div className="bg-card rounded-xl border border-border p-5 h-[320px] overflow-y-auto">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Recent Activity 
      </h3>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <ActivitySkeleton key={i} />)}
        </div>
      ) : activity.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-8">
          No recent activity yet.
        </p>
      ) : (
        <div className="space-y-4">
          {activity.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5',
                getAvatarColor(item.user.name)
              )}>
                {getInitials(item.user.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground leading-relaxed">
                  <span className="font-medium">{item.user.name}</span>
                  {' '}{item.message}
                </p>
                <RelativeTime dateString={item.createdAt} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


