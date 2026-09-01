// 'use client'

// import { useCallback, useEffect, useState } from 'react'
// import Link from 'next/link'
// import {
//   CalendarSync,
//   CircleCheck,
//   CircleDashed,
//   ChevronRight,
//   TriangleAlert,
// } from 'lucide-react'

// import { calendarApi } from '@/lib/api/calendar.api'
// import { formatDate, formatRelativeTime } from '@/utils'

// const PRIORITY_BAR = {
//   critical: 'bg-red-400',
//   high: 'bg-orange-400',
//   medium: 'bg-amber-400',
//   low: 'bg-slate-300',
// }

// const MAX_ROWS = 5

// export function CalendarSyncWidget() {
//   const [data, setData] = useState(null)
//   const [isLoading, setIsLoading] = useState(true)
//   const [error, setError] = useState(false)

//   const load = useCallback(async () => {
//     setIsLoading(true)
//     setError(false)

//     try {
//       const result = await calendarApi.getUpcomingEvents({
//         limit: MAX_ROWS,
//         days: 14,
//       })

//       setData(result)
//     } catch {
//       setError(true)
//     } finally {
//       setIsLoading(false)
//     }
//   }, [])

//   useEffect(() => {
//     load()
//   }, [load])

//   const events = data?.events || []
//   const connected = Boolean(data?.connected)

//   return (
//     <div
//       className="
//         flex h-full min-h-0 flex-col
//         overflow-hidden
//         rounded-2xl
//         border border-slate-200
//         bg-white
//         shadow-sm
//       "
//     >
//       {/* =========================================
//           FIXED HEADER
//       ========================================== */}
//       <div
//         className="
//           flex h-[32px] shrink-0
//           items-center justify-between
//           border-b border-slate-100
//           px-3
//         "
//       >
//         <div className="flex min-w-0 items-center gap-1.5">
//           <div
//             className="
//               flex h-5 w-5 shrink-0
//               items-center justify-center
//               rounded-full
//               bg-violet-50
//             "
//           >
//             <CalendarSync className="h-3 w-3 text-violet-600" />
//           </div>

//           <div className="min-w-0">
//             <h3
//               className="
//                 truncate
//                 text-[10px]
//                 font-semibold
//                 leading-none
//                 text-slate-700
//               "
//             >
//               Calendar Sync
//             </h3>

//             {connected && data?.lastSyncedAt && (
//               <p
//                 className="
//                   mt-0.5 truncate
//                   text-[7px]
//                   leading-none
//                   text-slate-400
//                 "
//               >
//                 Last synced {formatRelativeTime(data.lastSyncedAt)}
//               </p>
//             )}
//           </div>
//         </div>

//         <Link
//           href="/calendar"
//           className="
//             flex shrink-0
//             items-center gap-0.5
//             text-[8px]
//             font-medium
//             text-violet-600
//             hover:text-violet-700
//           "
//         >
//           {connected ? 'Manage' : 'Connect'}

//           <ChevronRight className="h-2.5 w-2.5" />
//         </Link>
//       </div>

//       {/* =========================================
//           LOADING
//       ========================================== */}
//       {isLoading ? (
//         <div className="min-h-0 flex-1 space-y-1.5 p-2.5">
//           {[0, 1, 2].map((i) => (
//             <div
//               key={i}
//               className="
//                 h-[24px]
//                 animate-pulse
//                 rounded-lg
//                 bg-slate-100
//               "
//             />
//           ))}
//         </div>
//       ) : error ? (

//         /* =======================================
//            ERROR
//         ======================================== */

//         <div
//           className="
//             flex min-h-0 flex-1
//             items-center justify-center
//             px-3 text-center
//           "
//         >
//           <p className="text-[8px] text-red-500">
//             Couldn&apos;t load calendar sync.{' '}

//             <button
//               type="button"
//               onClick={load}
//               className="
//                 font-medium
//                 underline
//                 underline-offset-2
//               "
//             >
//               Retry
//             </button>
//           </p>
//         </div>
//       ) : !connected ? (

//         /* =======================================
//            NOT CONNECTED
//         ======================================== */

//         <div
//           className="
//             flex min-h-0 flex-1
//             flex-col
//             items-center justify-center
//             px-3
//             text-center
//           "
//         >
//           <div
//             className="
//               mb-1.5
//               flex h-7 w-7
//               items-center justify-center
//               rounded-full
//               bg-violet-50
//             "
//           >
//             <CalendarSync className="h-3.5 w-3.5 text-violet-500" />
//           </div>

//           <p className="text-[9px] font-medium text-slate-600">
//             No calendar connected
//           </p>

//           <p className="mt-0.5 text-[7px] text-slate-400">
//             Connect Google or Outlook
//           </p>

//           <Link
//             href="/calendar"
//             className="
//               mt-1.5
//               rounded-md
//               bg-violet-600
//               px-2 py-1
//               text-[7px]
//               font-medium
//               text-white
//               hover:bg-violet-700
//             "
//           >
//             Connect calendar
//           </Link>
//         </div>
//       ) : events.length === 0 ? (

//         /* =======================================
//            CONNECTED - NO EVENTS
//         ======================================== */

//         <div
//           className="
//             flex min-h-0 flex-1
//             flex-col
//             items-center justify-center
//             px-3
//             text-center
//           "
//         >
//           <CircleCheck className="mb-1.5 h-5 w-5 text-emerald-500" />

//           <p className="text-[9px] font-medium text-slate-600">
//             Everything is up to date
//           </p>

//           <p className="mt-0.5 text-[7px] text-slate-400">
//             Nothing due in the next two weeks.
//           </p>
//         </div>
//       ) : (
//         <>
//           {/* =====================================
//               EVENT LIST
//               ONLY THIS AREA SCROLLS
//           ====================================== */}
//           <div
//             className="
//               min-h-0 flex-1
//               overflow-y-auto
//               overscroll-contain
//               px-2.5 py-1.5
//             "
//           >
//             <div className="space-y-1">
//               {events.slice(0, MAX_ROWS).map((event) => (
//                 <Link
//                   key={event.sourceId}
//                   href={event.link}
//                   className="
//                     flex h-[25px]
//                     items-center gap-2
//                     rounded-lg
//                     border border-slate-100
//                     bg-slate-50/60
//                     px-2
//                     transition-colors
//                     hover:bg-slate-50
//                   "
//                 >
//                   {/* PRIORITY */}
//                   <span
//                     className={`
//                       h-4 w-[3px]
//                       shrink-0
//                       rounded-full
//                       ${
//                         PRIORITY_BAR[event.priority] ||
//                         PRIORITY_BAR.low
//                       }
//                     `}
//                   />

//                   {/* EVENT */}
//                   <div className="min-w-0 flex-1">
//                     <p
//                       className="
//                         truncate
//                         text-[8px]
//                         font-medium
//                         leading-none
//                         text-slate-700
//                       "
//                     >
//                       {event.title}
//                     </p>

//                     <p
//                       className="
//                         mt-0.5 truncate
//                         text-[6.5px]
//                         leading-none
//                         text-slate-400
//                       "
//                     >
//                       {formatDate(
//                         event.dueDate,
//                         'EEE, MMM dd'
//                       )}

//                       {event.projectName
//                         ? ` · ${event.projectName}`
//                         : ''}
//                     </p>
//                   </div>

//                   {/* SYNC STATUS */}
//                   <div
//                     className="shrink-0"
//                     title={
//                       event.synced
//                         ? `Synced to ${event.provider}`
//                         : 'Queued for next sync'
//                     }
//                   >
//                     {event.synced ? (
//                       <CircleCheck className="h-3 w-3 text-emerald-500" />
//                     ) : (
//                       <CircleDashed className="h-3 w-3 text-slate-300" />
//                     )}
//                   </div>
//                 </Link>
//               ))}
//             </div>
//           </div>

//           {/* =====================================
//               FIXED BOTTOM STATUS
//           ====================================== */}
//           {data?.providers?.length > 0 && (
//             <div
//               className="
//                 flex h-[24px] shrink-0
//                 items-center gap-1.5
//                 border-t border-slate-100
//                 px-3
//               "
//             >
//               {events.some((event) => !event.synced) ? (
//                 <>
//                   <TriangleAlert className="h-3 w-3 shrink-0 text-amber-500" />

//                   <p className="truncate text-[7px] text-slate-400">
//                     Some items are waiting for sync.
//                   </p>
//                 </>
//               ) : (
//                 <>
//                   <CircleCheck className="h-3 w-3 shrink-0 text-emerald-500" />

//                   <p className="truncate text-[7px] text-slate-400">
//                     Everything is up to date on{' '}
//                     {data.providers.join(' and ')}.
//                   </p>
//                 </>
//               )}
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   )
// }

// export default CalendarSyncWidget

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  CalendarSync,
  CircleCheck,
  CircleDashed,
  ChevronRight,
  TriangleAlert,
} from 'lucide-react'

import { calendarApi } from '@/lib/api/calendar.api'
import { formatDate, formatRelativeTime } from '@/utils'

const PRIORITY_BAR = {
  critical: 'bg-red-400',
  high: 'bg-orange-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-300',
}

const MAX_ROWS = 5

export function CalendarSyncWidget() {
  const [data, setData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(false)

    try {
      const result = await calendarApi.getUpcomingEvents({
        limit: MAX_ROWS,
        days: 14,
      })

      setData(result)
    } catch {
      setError(true)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const events = data?.events || []
  const connected = Boolean(data?.connected)

  return (
    <div
      className="
        flex h-full min-h-0 flex-col
        overflow-hidden
        rounded-2xl
        border border-slate-200
        bg-white
        shadow-sm
      "
    >
      {/* =========================================
          FIXED HEADER
      ========================================== */}
      <div
        className="
          flex h-[32px] shrink-0
          items-center justify-between
          border-b border-slate-100
          px-3
        "
      >
        <div className="flex min-w-0 items-center gap-1.5">
          <div
            className="
              flex h-7 w-7 shrink-0
              items-center justify-center
              rounded-full
              bg-violet-50
            "
          >
            <CalendarSync className="h-3 w-3 text-violet-600" />
          </div>

          <div className="min-w-0">
            <h3
              className="
                truncate
                text-[10px]
                font-semibold
                leading-none
                text-slate-700
              "
            >
              Calendar Sync
            </h3>

            {connected && data?.lastSyncedAt && (
              <p
                className="
                  mt-0.5 truncate
                  text-[9px]
                  leading-none
                  text-slate-400
                "
              >
                Last synced {formatRelativeTime(data.lastSyncedAt)}
              </p>
            )}
          </div>
        </div>

        <Link
          href="/calendar"
          className="
            flex shrink-0
            items-center gap-0.5
            text-[10px]
            font-medium
            text-violet-600
            hover:text-violet-700
          "
        >
          {connected ? 'Manage' : 'Connect'}

          <ChevronRight className="h-2.5 w-2.5" />
        </Link>
      </div>

      {/* =========================================
          LOADING
      ========================================== */}
      {isLoading ? (
        <div className="min-h-0 flex-1 space-y-1.5 p-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="
                h-[30px]
                animate-pulse
                rounded-lg
                bg-slate-100
              "
            />
          ))}
        </div>
      ) : error ? (

        /* =======================================
           ERROR
        ======================================== */

        <div
          className="
            flex min-h-0 flex-1
            items-center justify-center
            px-3 text-center
          "
        >
          <p className="text-[10px] text-red-500">
            Couldn&apos;t load calendar sync.{' '}

            <button
              type="button"
              onClick={load}
              className="
                font-medium
                underline
                underline-offset-2
              "
            >
              Retry
            </button>
          </p>
        </div>
      ) : !connected ? (

        /* =======================================
           NOT CONNECTED
        ======================================== */

        <div
          className="
            flex min-h-0 flex-1
            flex-col
            items-center justify-center
            px-3
            text-center
          "
        >
          <div
            className="
              mb-1.5
              flex h-7 w-7
              items-center justify-center
              rounded-full
              bg-violet-50
            "
          >
            <CalendarSync className="h-4 w-4 text-violet-500" />
          </div>

          <p className="text-[9px] font-medium text-slate-600">
            No calendar connected
          </p>

          <p className="mt-0.5 text-[9px] text-slate-400">
            Connect Google or Outlook
          </p>

          <Link
            href="/calendar"
            className="
              mt-1.5
              rounded-md
              bg-violet-600
              px-2 py-1
              text-[9px]
              font-medium
              text-white
              hover:bg-violet-700
            "
          >
            Connect calendar
          </Link>
        </div>
      ) : events.length === 0 ? (

        /* =======================================
           CONNECTED - NO EVENTS
        ======================================== */

        <div
          className="
            flex min-h-0 flex-1
            flex-col
            items-center justify-center
            px-3
            text-center
          "
        >
          <CircleCheck className="mb-1.5 h-7 w-7 text-emerald-500" />

          <p className="text-[9px] font-medium text-slate-600">
            Everything is up to date
          </p>

          <p className="mt-0.5 text-[9px] text-slate-400">
            Nothing due in the next two weeks.
          </p>
        </div>
      ) : (
        <>
          {/* =====================================
              EVENT LIST
              ONLY THIS AREA SCROLLS
          ====================================== */}
          <div
            className="
              min-h-0 flex-1
              overflow-y-auto
              overscroll-contain
              px-2.5 py-1.5
            "
          >
            <div className="space-y-1">
              {events.slice(0, MAX_ROWS).map((event) => (
                <Link
                  key={event.sourceId}
                  href={event.link}
                  className="
                    flex h-[32px]
                    items-center gap-2
                    rounded-lg
                    border border-slate-100
                    bg-slate-50/60
                    px-2
                    transition-colors
                    hover:bg-slate-50
                  "
                >
                  {/* PRIORITY */}
                  <span
                    className={`
                      h-5 w-[4px]
                      shrink-0
                      rounded-full
                      ${
                        PRIORITY_BAR[event.priority] ||
                        PRIORITY_BAR.low
                      }
                    `}
                  />

                  {/* EVENT */}
                  <div className="min-w-0 flex-1">
                    <p
                      className="
                        truncate
                        text-[10px]
                        font-medium
                        leading-none
                        text-slate-700
                      "
                    >
                      {event.title}
                    </p>

                    <p
                      className="
                        mt-0.5 truncate
                        text-[8px]
                        leading-none
                        text-slate-400
                      "
                    >
                      {formatDate(
                        event.dueDate,
                        'EEE, MMM dd'
                      )}

                      {event.projectName
                        ? ` · ${event.projectName}`
                        : ''}
                    </p>
                  </div>

                  {/* SYNC STATUS */}
                  <div
                    className="shrink-0"
                    title={
                      event.synced
                        ? `Synced to ${event.provider}`
                        : 'Queued for next sync'
                    }
                  >
                    {event.synced ? (
                      <CircleCheck className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <CircleDashed className="h-3 w-3 text-slate-300" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* =====================================
              FIXED BOTTOM STATUS
          ====================================== */}
          {data?.providers?.length > 0 && (
            <div
              className="
                flex h-[30px] shrink-0
                items-center gap-1.5
                border-t border-slate-100
                px-3
              "
            >
              {events.some((event) => !event.synced) ? (
                <>
                  <TriangleAlert className="h-3 w-3 shrink-0 text-amber-500" />

                  <p className="truncate text-[9px] text-slate-400">
                    Some items are waiting for sync.
                  </p>
                </>
              ) : (
                <>
                  <CircleCheck className="h-3 w-3 shrink-0 text-emerald-500" />

                  <p className="truncate text-[9px] text-slate-400">
                    Everything is up to date on{' '}
                    {data.providers.join(' and ')}.
                  </p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CalendarSyncWidget