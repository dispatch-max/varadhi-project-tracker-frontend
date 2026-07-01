'use client'

import { useEffect, useState } from 'react'
import {
  FolderOpen, ListChecks, CheckCircle2,
  Clock, AlertTriangle, Users
} from 'lucide-react'
import { dashboardApi } from '@/lib/api/dashboard.api'
import { cn } from '@/utils'

const STAT_CONFIG = [
  { label: 'Total Projects',  key: 'totalProjects',   icon: FolderOpen,     color: 'bg-violet-50 text-violet-600', trend: 'All projects'       },
  { label: 'Active Projects', key: 'activeProjects',  icon: FolderOpen,     color: 'bg-blue-50 text-blue-600',    trend: 'Currently running'  },
  { label: 'Total Tasks',     key: 'totalTasks',      icon: ListChecks,     color: 'bg-slate-50 text-slate-600',  trend: 'Across all projects'},
  { label: 'Completed',       key: 'completedTasks',  icon: CheckCircle2,   color: 'bg-green-50 text-green-600',  trend: 'Tasks finished'     },
  { label: 'In Progress',     key: 'inProgressTasks', icon: Clock,          color: 'bg-amber-50 text-amber-600',  trend: 'Being worked on'    },
  { label: 'Overdue',         key: 'overdueTasks',    icon: AlertTriangle,  color: 'bg-red-50 text-red-600',      trend: 'Needs attention'    },
]

// Skeleton loader for a single card
function StatSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 animate-pulse">
      <div className="w-9 h-9 bg-slate-100 rounded-lg mb-3" />
      <div className="h-7 w-12 bg-slate-100 rounded mb-2" />
      <div className="h-3 w-20 bg-slate-100 rounded mb-1" />
      <div className="h-3 w-16 bg-slate-100 rounded" />
    </div>
  )
}

export function StatsCards() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await dashboardApi.getStats()
        setStats(data)
      } catch (err) {
        setError('Failed to load stats.')
        // Fallback to mock data if API fails
        setStats({
          totalProjects: 0,
          activeProjects: 0,
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
        })
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {STAT_CONFIG.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.key}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
          >
            <div className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center mb-3',
              stat.color
            )}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-semibold text-slate-800 leading-none mb-1">
              {stats?.[stat.key] ?? 0}
            </p>
            <p className="text-xs font-medium text-slate-600 mb-1">
              {stat.label}
            </p>
            <p className="text-xs text-slate-400">
              {stat.trend}
            </p>
          </div>
        )
      })}
    </div>
  )
}


// 'use client'

// import {
//   FolderOpen, ListChecks, CheckCircle2,
//   Clock, AlertTriangle, Users
// } from 'lucide-react'
// import { cn } from '@/utils'

// const STATS = [
//   {
//     label: 'Total Projects',
//     key: 'totalProjects',
//     icon: FolderOpen,
//     color: 'bg-violet-50 text-violet-600',
//     trend: '+2 this month',
//   },
//   {
//     label: 'Active Projects',
//     key: 'activeProjects',
//     icon: FolderOpen,
//     color: 'bg-blue-50 text-blue-600',
//     trend: 'Currently running',
//   },
//   {
//     label: 'Total Tasks',
//     key: 'totalTasks',
//     icon: ListChecks,
//     color: 'bg-slate-50 text-slate-600',
//     trend: 'Across all projects',
//   },
//   {
//     label: 'Completed',
//     key: 'completedTasks',
//     icon: CheckCircle2,
//     color: 'bg-green-50 text-green-600',
//     trend: 'Tasks finished',
//   },
//   {
//     label: 'In Progress',
//     key: 'inProgressTasks',
//     icon: Clock,
//     color: 'bg-amber-50 text-amber-600',
//     trend: 'Being worked on',
//   },
//   {
//     label: 'Overdue',
//     key: 'overdueTasks',
//     icon: AlertTriangle,
//     color: 'bg-red-50 text-red-600',
//     trend: 'Needs attention',
//   },
// ]

// export function StatsCards({ stats }) {
//   // Use mock data if no real data yet
//   const data = stats || {
//     totalProjects: 8,
//     activeProjects: 5,
//     totalTasks: 64,
//     completedTasks: 38,
//     inProgressTasks: 14,
//     overdueTasks: 3,
//   }

//   return (
//     <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
//       {STATS.map((stat) => {
//         const Icon = stat.icon
//         return (
//           <div
//             key={stat.key}
//             className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
//           >
//             <div className={cn(
//               'w-9 h-9 rounded-lg flex items-center justify-center mb-3',
//               stat.color
//             )}>
//               <Icon className="w-4 h-4" />
//             </div>
//             <p className="text-2xl font-semibold text-slate-800 leading-none mb-1">
//               {data[stat.key] ?? 0}
//             </p>
//             <p className="text-xs font-medium text-slate-600 mb-1">
//               {stat.label}
//             </p>
//             <p className="text-xs text-slate-400">
//               {stat.trend}
//             </p>
//           </div>
//         )
//       })}
//     </div>
//   )
// }