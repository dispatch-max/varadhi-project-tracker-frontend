'use client'

import { useDroppable } from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { KanbanCard } from './kanban-card'
import { cn } from '@/utils'

export function KanbanColumn({ column, tasks }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  return (
    <div className="flex flex-col min-w-[280px] max-w-[280px]">

      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className={cn(
          'w-2.5 h-2.5 rounded-full flex-shrink-0',
          column.color
        )} />
        <h3 className="text-sm font-semibold text-slate-700">
          {column.label}
        </h3>
        <span className="ml-auto text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-xl p-2 space-y-2.5 min-h-[500px] transition-colors',
          isOver
            ? 'bg-violet-50 border-2 border-dashed border-violet-300'
            : 'bg-slate-100/60 border-2 border-transparent'
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-slate-400">
            No tasks here
          </div>
        )}
      </div>
    </div>
  )
}