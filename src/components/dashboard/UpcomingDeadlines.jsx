// 'use client'

// import { useEffect, useState } from 'react'
// import Link from 'next/link'
// import { Card } from '@/components/ui/card'

// import { tasksApi } from '@/lib/api/tasks.api'
// import {
//   formatDueLabel,
//   priorityBadgeClass,
//   priorityLabel,
// } from '@/lib/deadline-format'

// function Shell({ children }) {
//   return (
//     <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

//       <div className="flex h-[30px] shrink-0 items-center justify-between border-b border-slate-100 px-3">
//         <h3 className="text-[11px] font-semibold text-slate-800">
//           Upcoming Deadlines
//         </h3>


//       </div>

//       {children}
//     </Card>
//   )
// }

// export function UpcomingDeadlines() {
//   const [tasks, setTasks] = useState([])
//   const [isLoading, setIsLoading] = useState(true)
//   const [error, setError] = useState(null)

//   useEffect(() => {
//     let cancelled = false

//     async function load() {
//       try {
//         const data = await tasksApi.getUpcoming({
//           limit: 5,
//           days: 30,
//         })

//         if (!cancelled) {
//           setTasks(data ?? [])
//         }
//       } catch {
//         if (!cancelled) {
//           setError('Failed to load deadlines.')
//         }
//       } finally {
//         if (!cancelled) {
//           setIsLoading(false)
//         }
//       }
//     }

//     load()

//     return () => {
//       cancelled = true
//     }
//   }, [])

//   if (isLoading) {
//     return (
//       <Shell>
//         <div className="min-h-0 flex-1 overflow-hidden">
//           {[0, 1, 2, 3].map((i) => (
//             <div
//               key={i}
//               className="flex items-center gap-3 px-3 py-2 animate-pulse"
//             >
//               <div className="h-2.5 w-16 rounded bg-slate-100" />
//               <div className="h-2.5 flex-1 rounded bg-slate-100" />
//             </div>
//           ))}
//         </div>
//       </Shell>
//     )
//   }

//   if (error) {
//     return (
//       <Shell>
//         <div className="flex min-h-0 flex-1 items-center justify-center">
//           <p className="text-[9px] text-slate-500">
//             {error}
//           </p>
//         </div>
//       </Shell>
//     )
//   }

//   return (
//     <Shell>
//       <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
//         <div className="divide-y divide-slate-100">
//           {tasks.map((task) => (
//             <Link
//               key={task.id}
//               href={`/tasks/${task.id}`}
//               className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50"
//             >
//               <div
//                 className={`w-[76px] shrink-0 text-[9px] ${
//                   task.isOverdue
//                     ? 'font-medium text-red-600'
//                     : 'text-slate-500'
//                 }`}
//               >
//                 {formatDueLabel(
//                   task.daysLeft,
//                   task.dueDate
//                 )}
//               </div>

//               <div className="min-w-0 flex-1">
//                 <p className="truncate text-[10px] font-medium text-slate-800">
//                   {task.title}
//                 </p>

//                 {task.projectName && (
//                   <p className="truncate text-[8px] text-slate-400">
//                     {task.projectName}
//                   </p>
//                 )}
//               </div>

//               <span
//                 className={`
//                   shrink-0 rounded-full
//                   px-2 py-0.5 text-[8px] font-medium
//                   ${priorityBadgeClass(task.priority)}
//                 `}
//               >
//                 {priorityLabel(task.priority)}
//               </span>
//             </Link>
//           ))}
//         </div>
//       </div>
//     </Shell>
//   )
// }

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'

import { tasksApi } from '@/lib/api/tasks.api'
import {
  formatDueLabel,
  priorityBadgeClass,
  priorityLabel,
} from '@/lib/deadline-format'

function Shell({ children }) {
  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
      <div className="flex h-[56px] shrink-0 items-start justify-between px-5 pt-3">
        <h3 className="text-[16px] font-semibold text-slate-800">
          Upcoming Deadlines
        </h3>
      </div>

      {children}
    </Card>
  )
}

export function UpcomingDeadlines() {
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await tasksApi.getUpcoming({
          limit: 5,
          days: 30,
        })

        if (!cancelled) {
          setTasks(data ?? [])
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load deadlines.')
        }
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

  if (isLoading) {
    return (
      <Shell>
        <div className="min-h-0 flex-1 overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex min-h-[66px] items-center gap-3 px-4 py-3 animate-pulse"
            >
              <div className="h-3 w-24 rounded bg-slate-100" />
              <div className="h-3 flex-1 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </Shell>
    )
  }

  if (error) {
    return (
      <Shell>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <p className="text-[12px] text-slate-500">
            {error}
          </p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      {/* Only this area scrolls */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="divide-y divide-slate-100">
          {tasks.map((task) => (
            <Link
              key={task.id}
              href={`/tasks/${task.id}`}
              className="
                  flex
                  min-h-[82px]
                  items-center
                  gap-4
                  px-5
                  py-4
                  transition
                  hover:bg-slate-50
                "
            >
              {/* DUE DATE */}
              <div
                className={`w-[120px] shrink-0 text-[13px] ${
                  task.isOverdue
                    ? 'font-medium text-red-600'
                    : 'text-slate-500'
                }`}
              >
                {formatDueLabel(
                  task.daysLeft,
                  task.dueDate
                )}
              </div>

              {/* TASK DETAILS */}
              <div className="min-w-0 flex-1">
                <p className="mt-0.5 truncate text-[11px] text-slate-400">
                  {task.title}
                </p>

                {task.projectName && (
                  <p className="mt-0.5 truncate text-[11px] text-slate-400">
                    {task.projectName}
                  </p>
                )}
              </div>

              {/* PRIORITY */}
              <span
                className={`
                  shrink-0
                  rounded-full
                  px-3.5
                  py-1.5
                  text-[11px]
                  font-medium
                  ${priorityBadgeClass(task.priority)}
                `}
              >
                {priorityLabel(task.priority)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  )
}