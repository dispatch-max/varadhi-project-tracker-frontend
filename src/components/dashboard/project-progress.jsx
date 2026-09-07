// 'use client'

// import { useEffect, useState } from 'react'
// import Link from 'next/link'

// import { calcProgress, cn } from '@/utils'
// import {
//   PROJECT_STATUS_COLORS,
//   PROJECT_STATUS_LABELS,
// } from '@/constants'
// import { dashboardApi } from '@/lib/api/dashboard.api'

// export function ProjectProgress() {
//   const [items, setItems] = useState([])

//   useEffect(() => {
//     async function loadProjects() {
//       try {
//         const data = await dashboardApi.getProjects()
//         setItems(data)
//       } catch (err) {
//         console.error(err)
//         setItems([])
//       }
//     }

//     loadProjects()
//   }, [])

//   return (
//     <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

//       {/* FIXED HEADER */}
//       <div className="flex h-[30px] shrink-0 items-center justify-between border-b border-slate-100 px-3">
//         <h3 className="text-[11px] font-semibold text-slate-800">
//           Project Progress
//         </h3>

//         <Link
//           href="/projects"
//           className="text-[8px] font-medium text-violet-600 hover:underline"
//         >
//           View all
//         </Link>
//       </div>

//       {/* SCROLL BODY */}
//       <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
//         <div className="divide-y divide-slate-100">
//           {items.map((project) => {
//             const progress = calcProgress(
//               project.completedTasksCount,
//               project.tasksCount
//             )

//             return (
//               <div
//                 key={project.id}
//                 className="px-3 py-1.5 hover:bg-slate-50"
//               >
//                 <div className="flex items-center justify-between gap-2">

//                   <div className="flex min-w-0 items-center gap-1.5">
//                     <p className="truncate text-[9px] font-medium text-slate-700">
//                       {project.name}
//                     </p>

//                     <span
//                       className={cn(
//                         'shrink-0 rounded px-1 py-[1px] text-[7px] font-medium',
//                         PROJECT_STATUS_COLORS[project.status]
//                       )}
//                     >
//                       {PROJECT_STATUS_LABELS[project.status]}
//                     </span>
//                   </div>

//                   <span className="shrink-0 text-[8px] font-semibold text-slate-500">
//                     {progress}%
//                   </span>
//                 </div>

//                 <div className="mt-1 h-[4px] overflow-hidden rounded-full bg-slate-100">
//                   <div
//                     className={cn(
//                       'h-full rounded-full',
//                       progress === 100
//                         ? 'bg-green-500'
//                         : progress > 60
//                         ? 'bg-violet-500'
//                         : progress > 30
//                         ? 'bg-amber-400'
//                         : 'bg-red-400'
//                     )}
//                     style={{
//                       width: `${progress}%`,
//                     }}
//                   />
//                 </div>

//                 <div className="mt-1 flex items-center justify-between">
//                   <p className="truncate text-[7px] text-slate-400">
//                     {project.manager_name}
//                   </p>

//                   <p className="text-[7px] text-slate-400">
//                     {project.completedTasksCount}/
//                     {project.tasksCount} tasks
//                   </p>
//                 </div>
//               </div>
//             )
//           })}
//         </div>
//       </div>
//     </div>
//   )
// }

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { calcProgress, cn } from '@/utils'
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '@/constants'
import { dashboardApi } from '@/lib/api/dashboard.api'

export function ProjectProgress() {
  const [items, setItems] = useState([])

  useEffect(() => {
    async function loadProjects() {
      try {
        setItems(await dashboardApi.getProjects())
      } catch (err) {
        console.error(err)
        setItems([])
      }
    }
    loadProjects()
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-[44px] shrink-0 items-center justify-between border-b border-slate-100 px-4">
        <h3 className="text-[13px] font-semibold text-slate-800">Project Progress</h3>
        <Link href="/projects" className="text-[10px] font-medium text-violet-600 hover:underline">View all</Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="divide-y divide-slate-100">
          {items.map((project) => {
            const progress = calcProgress(project.completedTasksCount, project.tasksCount)
            return (
              <div key={project.id} className="px-4 py-2.5 hover:bg-slate-50">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-[11px] font-medium text-slate-700">{project.name}</p>
                    <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[9px] font-medium', PROJECT_STATUS_COLORS[project.status])}>
                      {PROJECT_STATUS_LABELS[project.status]}
                    </span>
                  </div>
                  <span className="shrink-0 text-[10px] font-semibold text-slate-500">{progress}%</span>
                </div>
                <div className="mt-2 h-[6px] overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      progress === 100 ? 'bg-green-500' : progress > 60 ? 'bg-violet-500' : progress > 30 ? 'bg-amber-400' : 'bg-red-400'
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between">
                  <p className="truncate text-[9px] text-slate-400">{project.manager_name}</p>
                  <p className="text-[9px] text-slate-400">{project.completedTasksCount}/{project.tasksCount} tasks</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
