import { Suspense } from 'react'

import { TaskStats } from '@/components/tasks/task-stats'
import { TasksList } from '@/components/tasks/tasks-list'
import { PriorityBreakdown } from '@/components/tasks/priority-breakdown'
import { UpcomingDeadlines } from '@/components/tasks/UpcomingDeadlines'

export default function TasksPage() {
  return (
    <main
      className="
        h-[calc(100dvh-60px)]
        max-h-[calc(100dvh-60px)]
        min-h-0
        w-full
        min-w-0
        overflow-hidden
        bg-slate-50
      "
    >
      <div
        className="
          flex
          h-full
          min-h-0
          w-full
          min-w-0
          flex-col
          overflow-hidden
          px-4
          py-2
        "
      >
        {/* STATS */}
        <section
          className="
            mb-2
            h-[74px]
            shrink-0
            overflow-hidden
          "
        >
          <TaskStats />
        </section>

        {/* MAIN CONTENT */}
        <section
          className="
            grid
            min-h-0
            min-w-0
            flex-1
            gap-3
            overflow-hidden
          "
          style={{
            gridTemplateColumns:
              'minmax(0,1fr) minmax(260px,300px)',
          }}
        >
          {/* LEFT */}
          <div
            className="
              h-full
              min-h-0
              min-w-0
              overflow-hidden
            "
          >
            <Suspense fallback={null}>
              <TasksList />
            </Suspense>
          </div>

          {/* RIGHT */}
          <div
            className="
              flex
              h-full
              min-h-0
              min-w-0
              flex-col
              gap-3
              overflow-hidden
            "
          >
            <div className="shrink-0 overflow-hidden">
              <PriorityBreakdown />
            </div>

            <div
              className="
                min-h-0
                flex-1
                overflow-hidden
              "
            >
              <UpcomingDeadlines />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}