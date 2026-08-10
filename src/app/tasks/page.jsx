import { Suspense } from 'react'
import { TaskHeader } from '@/components/tasks/task-header'
import { TaskStats } from '@/components/tasks/task-stats'
import { TasksList } from '@/components/tasks/tasks-list'

import { TaskOverview } from '@/components/tasks/task-overview'
import { PriorityBreakdown } from '@/components/tasks/priority-breakdown'
import { UpcomingDeadlines } from '@/components/tasks/UpcomingDeadlines'
import { AiTaskInsights } from '@/components/tasks/ai-task-insights'

export default function TasksPage() {
  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-semibold text-foreground">
          Tasks
        </h2>

        <p className="mt-0.5 text-sm text-muted-foreground">
          Organize, prioritize and track tasks to get things done.
        </p>
      </div>

      <TaskHeader />

      <TaskStats />

      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left */}
        <div className="col-span-8">
          {/* Suspense required: TasksList reads useSearchParams() (topbar search
              hand-off) and this page is statically prerendered. */}
          <Suspense fallback={null}>
            <TasksList />
          </Suspense>
        </div>

        {/* Right */}
        <div className="col-span-4 space-y-4 min-h-full">
          <PriorityBreakdown />
          <UpcomingDeadlines />
          <AiTaskInsights />
        </div>
      </div>

    </div>
  )
}