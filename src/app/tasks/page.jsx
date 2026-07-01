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
      <TasksList />
    </div>
  )
}