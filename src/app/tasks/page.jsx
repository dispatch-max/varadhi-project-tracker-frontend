import { Suspense } from 'react'
import { TasksList } from '@/components/tasks/tasks-list'

export const metadata = {
  title: 'Tasks',
}

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">Tasks</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          View and manage all tasks across projects.
        </p>
      </div>
      {/* Suspense required: TasksList reads useSearchParams() (topbar search
          hand-off) and this page is statically prerendered. */}
      <Suspense fallback={null}>
        <TasksList />
      </Suspense>
    </div>
  )
}