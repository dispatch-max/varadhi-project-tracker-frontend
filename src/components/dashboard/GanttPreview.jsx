// 'use client'

// import { useEffect, useState } from 'react'
// import {
//   CalendarDays,
//   MoreHorizontal,
//   Flag,
// } from 'lucide-react'
// import { dashboardApi } from '@/lib/api/dashboard.api'

// const BAR_COLORS = [
//   'bg-gradient-to-r from-indigo-600 to-violet-500',
//   'bg-gradient-to-r from-violet-600 to-purple-500',
//   'bg-gradient-to-r from-emerald-500 to-teal-400',
//   'bg-gradient-to-r from-indigo-500 to-violet-400',
// ]

// const shortDate = (value) =>
//   value
//     ? new Date(value).toLocaleDateString(undefined, {
//         month: 'short',
//         day: 'numeric',
//       })
//     : '—'

// function axisTicks(startIso, endIso) {
//   const start = new Date(startIso).getTime()
//   const end = new Date(endIso).getTime()

//   if (Number.isNaN(start) || Number.isNaN(end)) {
//     return []
//   }

//   return Array.from({ length: 4 }, (_, i) =>
//     shortDate(
//       new Date(
//         start + ((end - start) * i) / 3
//       )
//     )
//   )
// }

// function Shell({ children }) {
//   return (
//     <div
//       className="
//         relative
//         flex h-full min-h-0 flex-col
//         overflow-hidden
//         rounded-2xl
//         border border-violet-100/80

//         bg-gradient-to-br
//         from-violet-100/80
//         via-purple-50/75
//         to-blue-100/70

//         shadow-[0_4px_16px_rgba(139,92,246,0.12)]
//       "
//     >
//       {/* BACKGROUND GLOW */}
//       <div
//         className="
//           pointer-events-none
//           absolute -right-10 -top-10
//           h-28 w-28
//           rounded-full
//           bg-violet-300/20
//           blur-3xl
//         "
//       />

//       {/* FIXED HEADER */}
//       <div
//         className="
//           relative z-10
//           flex h-[32px] shrink-0
//           items-center justify-between
//           px-3
//         "
//       >
//         <div className="flex items-center gap-1.5">
//           <div
//             className="
//               flex h-5 w-5 shrink-0
//               items-center justify-center
//               rounded-full
//               bg-violet-500
//             "
//           >
//             <CalendarDays className="h-3 w-3 text-white" />
//           </div>

//           <h3 className="text-[11px] font-semibold text-slate-700">
//             Gantt Timeline Preview
//           </h3>
//         </div>

//         <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
//       </div>

//       {children}
//     </div>
//   )
// }

// export function GanttPreview() {
//   const [data, setData] = useState(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [error, setError] = useState(null)

//   useEffect(() => {
//     let cancelled = false

//     async function load() {
//       try {
//         const result = await dashboardApi.getGantt()

//         if (!cancelled) {
//           setData(result)
//         }
//       } catch {
//         if (!cancelled) {
//           setError('Failed to load timeline.')
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

//   /* =====================================================
//      LOADING
//   ====================================================== */

//   if (isLoading) {
//     return (
//       <Shell>
//         <div className="min-h-0 flex-1 px-3 pb-3">
//           <div
//             className="
//               h-full
//               rounded-xl
//               border border-white/60
//               bg-white/55
//               p-3
//             "
//           >
//             <div className="space-y-3">
//               {[0, 1, 2, 3].map((i) => (
//                 <div
//                   key={i}
//                   className="h-5 animate-pulse rounded-full bg-slate-100"
//                   style={{
//                     width: `${70 - i * 8}%`,
//                   }}
//                 />
//               ))}
//             </div>
//           </div>
//         </div>
//       </Shell>
//     )
//   }

//   /* =====================================================
//      ERROR
//   ====================================================== */

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

//   const projects = (data?.projects ?? []).slice(0, 4)

//   /* =====================================================
//      EMPTY
//   ====================================================== */

//   if (projects.length === 0) {
//     return (
//       <Shell>
//         <div className="flex min-h-0 flex-1 items-center justify-center">
//           <div className="text-center">
//             <p className="text-[9px] text-slate-500">
//               No scheduled projects.
//             </p>

//             <p className="mt-1 text-[8px] text-slate-400">
//               Projects need start and end dates to appear here.
//             </p>
//           </div>
//         </div>
//       </Shell>
//     )
//   }

//   const ticks = axisTicks(
//     data.windowStart,
//     data.windowEnd
//   )

//   return (
//     <Shell>

//       {/* =================================================
//           GANTT BODY
//       ================================================== */}

//       <div
//         className="
//           relative z-10
//           min-h-0 flex-1
//           px-3 pb-3
//         "
//       >
//         <div
//           className="
//             h-full
//             min-h-0
//             overflow-hidden
//             rounded-xl
//             border border-white/60
//             bg-white/55
//             backdrop-blur-sm
//           "
//         >

//           {/* =============================================
//               DATE HEADER
//           ============================================== */}

//           <div
//             className="
//               grid h-[28px]
//               border-b border-slate-100
//             "
//             style={{
//               gridTemplateColumns:
//                 '145px minmax(0,1fr)',
//             }}
//           >
//             {/* LEFT EMPTY HEADER */}
//             <div
//               className="
//                 border-r
//                 border-slate-100
//               "
//             />

//             {/* DATES */}
//             <div className="grid grid-cols-4">
//               {ticks.map((tick, i) => (
//                 <div
//                   key={i}
//                   className="
//                     flex items-center
//                     justify-center
//                     border-r
//                     border-slate-100
//                     text-[8px]
//                     text-slate-500
//                     last:border-r-0
//                   "
//                 >
//                   {tick}
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* =============================================
//               PROJECT ROWS
//           ============================================== */}

//           <div className="min-h-0 flex-1">

//             {projects.map((project, index) => {
//               const offset = Math.min(
//                 Math.max(project.offsetPercent ?? 0, 0),
//                 88
//               )

//               const width = Math.min(
//                 Math.max(project.widthPercent ?? 20, 18),
//                 100 - offset
//               )

//               return (
//                 <div
//                   key={project.id}
//                   className="
//                     grid h-[31px]
//                     border-b
//                     border-slate-100
//                     last:border-b-0
//                   "
//                   style={{
//                     gridTemplateColumns:
//                       '145px minmax(0,1fr)',
//                   }}
//                 >

//                   {/* ===================================
//                       LEFT PROJECT NAME
//                   ==================================== */}

//                   <div
//                     className="
//                       flex min-w-0
//                       items-center gap-1.5
//                       border-r
//                       border-slate-100
//                       px-2
//                     "
//                   >
//                     <span
//                       className={`
//                         h-2 w-2
//                         shrink-0
//                         rounded-full
//                         ${
//                           index === 0
//                             ? 'bg-indigo-500'
//                             : index === 1
//                               ? 'bg-violet-500'
//                               : index === 2
//                                 ? 'bg-emerald-500'
//                                 : 'bg-indigo-400'
//                         }
//                       `}
//                     />

//                     <span
//                       className="
//                         min-w-0 flex-1
//                         truncate
//                         text-[8px]
//                         font-medium
//                         text-slate-600
//                       "
//                     >
//                       {project.name}
//                     </span>
//                   </div>

//                   {/* ===================================
//                       RIGHT TIMELINE AREA
//                   ==================================== */}

//                   <div className="relative min-w-0 overflow-hidden">

//                     {/* GRID LINES */}
//                     <div className="absolute inset-0 grid grid-cols-8">
//                       {Array.from({
//                         length: 8,
//                       }).map((_, i) => (
//                         <div
//                           key={i}
//                           className="border-r border-slate-100"
//                         />
//                       ))}
//                     </div>

//                     {/* PROJECT BAR */}
//                     <div
//                       title={`${project.name} · ${shortDate(
//                         project.startDate
//                       )} – ${shortDate(
//                         project.endDate
//                       )} · ${project.percent}% complete`}
//                       className={`
//                         absolute
//                         top-1/2
//                         flex h-[20px]
//                         -translate-y-1/2
//                         items-center
//                         justify-between
//                         overflow-hidden
//                         rounded-full
//                         px-2
//                         text-white
//                         shadow-sm
//                         ${
//                           BAR_COLORS[
//                             index %
//                               BAR_COLORS.length
//                           ]
//                         }
//                       `}
//                       style={{
//                         left: `${offset}%`,
//                         width: `${width}%`,
//                         minWidth: '90px',
//                       }}
//                     >
//                       <div
//                         className="
//                           flex min-w-0
//                           items-center
//                           gap-1
//                         "
//                       >
//                         <Flag className="h-2.5 w-2.5 shrink-0" />

//                         <span
//                           className="
//                             truncate
//                             text-[8px]
//                             font-medium
//                           "
//                         >
//                           {project.name}
//                         </span>
//                       </div>

//                       <span
//                         className="
//                           ml-2
//                           shrink-0
//                           text-[7px]
//                         "
//                       >
//                         {project.percent}%
//                       </span>
//                     </div>

//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         </div>
//       </div>
//     </Shell>
//   )
// }

'use client'

import { useEffect, useState } from 'react'
import {
  CalendarDays,
  MoreHorizontal,
  Flag,
} from 'lucide-react'
import { dashboardApi } from '@/lib/api/dashboard.api'

const BAR_COLORS = [
  'bg-gradient-to-r from-indigo-600 to-violet-500',
  'bg-gradient-to-r from-violet-600 to-purple-500',
  'bg-gradient-to-r from-emerald-500 to-teal-400',
  'bg-gradient-to-r from-indigo-500 to-violet-400',
]

const shortDate = (value) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : '—'

function axisTicks(startIso, endIso) {
  const start = new Date(startIso).getTime()
  const end = new Date(endIso).getTime()

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return []
  }

  return Array.from({ length: 4 }, (_, i) =>
    shortDate(
      new Date(
        start + ((end - start) * i) / 3
      )
    )
  )
}

function Shell({ children }) {
  return (
    <div
      className="
        relative
        flex h-full min-h-0 flex-col
        overflow-hidden
        rounded-2xl
        border border-violet-100/80

        bg-gradient-to-br
        from-violet-100/80
        via-purple-50/75
        to-blue-100/70

        shadow-[0_4px_16px_rgba(139,92,246,0.12)]
      "
    >
      {/* BACKGROUND GLOW */}
      <div
        className="
          pointer-events-none
          absolute -right-10 -top-10
          h-28 w-28
          rounded-full
          bg-violet-300/20
          blur-3xl
        "
      />

      {/* FIXED HEADER */}
      <div
        className="
          relative z-10
          flex h-[44px] shrink-0
          items-center justify-between
          px-3
        "
      >
        <div className="flex items-center gap-1.5">
          <div
            className="
              flex h-7 w-7 shrink-0
              items-center justify-center
              rounded-full
              bg-violet-500
            "
          >
            <CalendarDays className="h-4 w-4 text-white" />
          </div>

          <h3 className="text-[13px] font-semibold text-slate-700">
            Gantt Timeline Preview
          </h3>
        </div>

        <MoreHorizontal className="h-3.5 w-3.5 text-slate-400" />
      </div>

      {children}
    </div>
  )
}

export function GanttPreview() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await dashboardApi.getGantt()

        if (!cancelled) {
          setData(result)
        }
      } catch {
        if (!cancelled) {
          setError('Failed to load timeline.')
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

  /* =====================================================
     LOADING
  ====================================================== */

  if (isLoading) {
    return (
      <Shell>
        <div className="min-h-0 flex-1 px-3 pb-3">
          <div
            className="
              h-full
              rounded-xl
              border border-white/60
              bg-white/55
              p-3
            "
          >
            <div className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-5 animate-pulse rounded-full bg-slate-100"
                  style={{
                    width: `${70 - i * 8}%`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </Shell>
    )
  }

  /* =====================================================
     ERROR
  ====================================================== */

  if (error) {
    return (
      <Shell>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <p className="text-[9px] text-slate-500">
            {error}
          </p>
        </div>
      </Shell>
    )
  }

  const projects = (data?.projects ?? []).slice(0, 4)

  /* =====================================================
     EMPTY
  ====================================================== */

  if (projects.length === 0) {
    return (
      <Shell>
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <div className="text-center">
            <p className="text-[9px] text-slate-500">
              No scheduled projects.
            </p>

            <p className="mt-1 text-[10px] text-slate-400">
              Projects need start and end dates to appear here.
            </p>
          </div>
        </div>
      </Shell>
    )
  }

  const ticks = axisTicks(
    data.windowStart,
    data.windowEnd
  )

  return (
    <Shell>

      {/* =================================================
          GANTT BODY
      ================================================== */}

      <div
        className="
          relative z-10
          min-h-0 flex-1
          px-3 pb-3
        "
      >
        <div
          className="
            h-full
            min-h-0
            overflow-hidden
            rounded-xl
            border border-white/60
            bg-white/55
            backdrop-blur-sm
          "
        >

          {/* =============================================
              DATE HEADER
          ============================================== */}

          <div
            className="
              grid h-[34px]
              border-b border-slate-100
            "
            style={{
              gridTemplateColumns:
                '145px minmax(0,1fr)',
            }}
          >
            {/* LEFT EMPTY HEADER */}
            <div
              className="
                border-r
                border-slate-100
              "
            />

            {/* DATES */}
            <div className="grid grid-cols-4">
              {ticks.map((tick, i) => (
                <div
                  key={i}
                  className="
                    flex items-center
                    justify-center
                    border-r
                    border-slate-100
                    text-[10px]
                    text-slate-500
                    last:border-r-0
                  "
                >
                  {tick}
                </div>
              ))}
            </div>
          </div>

          {/* =============================================
              PROJECT ROWS
          ============================================== */}

          <div className="min-h-0 flex-1">

            {projects.map((project, index) => {
              const offset = Math.min(
                Math.max(project.offsetPercent ?? 0, 0),
                88
              )

              const width = Math.min(
                Math.max(project.widthPercent ?? 20, 18),
                100 - offset
              )

              return (
                <div
                  key={project.id}
                  className="
                    grid h-[42px]
                    border-b
                    border-slate-100
                    last:border-b-0
                  "
                  style={{
                    gridTemplateColumns:
                      '145px minmax(0,1fr)',
                  }}
                >

                  {/* ===================================
                      LEFT PROJECT NAME
                  ==================================== */}

                  <div
                    className="
                      flex min-w-0
                      items-center gap-1.5
                      border-r
                      border-slate-100
                      px-2
                    "
                  >
                    <span
                      className={`
                        h-2.5 w-2.5
                        shrink-0
                        rounded-full
                        ${
                          index === 0
                            ? 'bg-indigo-500'
                            : index === 1
                              ? 'bg-violet-500'
                              : index === 2
                                ? 'bg-emerald-500'
                                : 'bg-indigo-400'
                        }
                      `}
                    />

                    <span
                      className="
                        min-w-0 flex-1
                        truncate
                        text-[10px]
                        font-medium
                        text-slate-600
                      "
                    >
                      {project.name}
                    </span>
                  </div>

                  {/* ===================================
                      RIGHT TIMELINE AREA
                  ==================================== */}

                  <div className="relative min-w-0 overflow-hidden">

                    {/* GRID LINES */}
                    <div className="absolute inset-0 grid grid-cols-8">
                      {Array.from({
                        length: 8,
                      }).map((_, i) => (
                        <div
                          key={i}
                          className="border-r border-slate-100"
                        />
                      ))}
                    </div>

                    {/* PROJECT BAR */}
                    <div
                      title={`${project.name} · ${shortDate(
                        project.startDate
                      )} – ${shortDate(
                        project.endDate
                      )} · ${project.percent}% complete`}
                      className={`
                        absolute
                        top-1/2
                        flex h-[26px]
                        -translate-y-1/2
                        items-center
                        justify-between
                        overflow-hidden
                        rounded-full
                        px-2
                        text-white
                        shadow-sm
                        ${
                          BAR_COLORS[
                            index %
                              BAR_COLORS.length
                          ]
                        }
                      `}
                      style={{
                        left: `${offset}%`,
                        width: `${width}%`,
                        minWidth: '90px',
                      }}
                    >
                      <div
                        className="
                          flex min-w-0
                          items-center
                          gap-1
                        "
                      >
                        <Flag className="h-2.5 w-2.5 shrink-0" />

                        <span
                          className="
                            truncate
                            text-[10px]
                            font-medium
                          "
                        >
                          {project.name}
                        </span>
                      </div>

                      <span
                        className="
                          ml-2
                          shrink-0
                          text-[9px]
                        "
                      >
                        {project.percent}%
                      </span>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Shell>
  )
}