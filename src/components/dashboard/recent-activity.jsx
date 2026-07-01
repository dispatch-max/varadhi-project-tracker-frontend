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
    <div className="bg-white rounded-xl border border-slate-200 p-5 h-full">
      <h3 className="text-sm font-semibold text-slate-800 mb-4">
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
                <p className="text-xs text-slate-700 leading-relaxed">
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


// 'use client'

// import { formatRelativeTime, getInitials, getAvatarColor, cn } from '@/utils'

// // Mock activity data — replace with real API later
// const MOCK_ACTIVITY = [
//   {
//     id: '1',
//     user: { name: 'Suhail H' },
//     message: 'completed task "Setup project scaffolding"',
//     createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
//   },
//   {
//     id: '2',
//     user: { name: 'Jagdish D' },
//     message: 'created project "Varadhi Tracker Backend"',
//     createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
//   },
//   {
//     id: '3',
//     user: { name: 'Arjun R' },
//     message: 'moved task "Auth flow" to In Review',
//     createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
//   },
//   {
//     id: '4',
//     user: { name: 'Suhail H' },
//     message: 'added comment on "Kanban board drag & drop"',
//     createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
//   },
//   {
//     id: '5',
//     user: { name: 'Jagdish D' },
//     message: 'assigned task "API endpoints" to Arjun R',
//     createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
//   },
//   {
//     id: '6',
//     user: { name: 'Arjun R' },
//     message: 'uploaded document "DB Schema v2.pdf"',
//     createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
//   },
// ]

// export function RecentActivity({ activity }) {
//   const items = activity || MOCK_ACTIVITY

//   return (
//     <div className="bg-white rounded-xl border border-slate-200 p-5 h-full">
//       <h3 className="text-sm font-semibold text-slate-800 mb-4">
//         Recent Activity
//       </h3>

//       <div className="space-y-4">
//         {items.map((item) => (
//           <div key={item.id} className="flex items-start gap-3">
//             {/* Avatar */}
//             <div className={cn(
//               'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 mt-0.5',
//               getAvatarColor(item.user.name)
//             )}>
//               {getInitials(item.user.name)}
//             </div>

//             {/* Content */}
//             <div className="flex-1 min-w-0">
//               <p className="text-xs text-slate-700 leading-relaxed">
//                 <span className="font-medium">{item.user.name}</span>
//                 {' '}{item.message}
//               </p>
//               <p className="text-xs text-slate-400 mt-0.5">
//                 {formatRelativeTime(item.createdAt)}
//               </p>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   )
// }