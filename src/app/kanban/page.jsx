import { KanbanBoard } from '@/components/kanban/kanban-board'

export const metadata = {
  title: 'Kanban Board',
}

export default function KanbanPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Kanban Board
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Drag and drop tasks across columns to update their status.
        </p>
      </div>
      <KanbanBoard />
    </div>
  )
}