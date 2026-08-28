'use client'

import { Calendar, AlertTriangle } from 'lucide-react'
import { StatusBadge, PriorityBadge, TypeBadge } from '@/components/tasks/task-badge'
import { formatDate, isOverdue, getInitials, getAvatarColor, cn } from '@/utils'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function KanbanCard({ task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const overdue =
    task.dueDate &&
    task.status !== 'completed' &&
    isOverdue(task.dueDate)

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
className={cn(
  'bg-card rounded-2xl border-2 p-4 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all',

  task.status === 'todo'
    ? 'border-slate-300'
    : task.status === 'in_progress'
    ? 'border-amber-500'
    : task.status === 'in_review' 
    ? 'border-blue-500'
    : task.status === 'completed'
    ? 'border-green-500 bg-green-50'
    : overdue
    ? 'border-red-500 bg-red-50'
    : 'border-border',

  isDragging && 'opacity-50 shadow-lg scale-105 rotate-1'
)}
    >
      {/* Type + Priority */}
      <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
        <TypeBadge type={task.type} />
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Title */}
     <p className="text-[15px] font-semibold text-foreground leading-6 mb-3">
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-3 mb-3 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">

        {/* Due date */}
        {task.dueDate ? (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            overdue ? 'text-red-500' : 'text-slate-400'
          )}>
{task.status === 'completed' ? (
  <Calendar className="w-3 h-3 text-green-600" />
) : overdue ? (
  <AlertTriangle className="w-3 h-3 text-red-500" />
) : (
  <Calendar className="w-3 h-3" />
)}
            <span>{formatDate(task.dueDate, 'MMM dd')}</span>
          </div>
        ) : (
          <span />
        )}

        {/* Assignee avatar */}
{/* Assignee */}
{task.assignee && (
  <div className="flex items-center gap-2">
    <div
      title={task.assignee.name}
      className={cn(
        'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0',
        getAvatarColor(task.assignee.name)
      )}
    >
      {getInitials(task.assignee.name)}
    </div>

    <span
      className="text-[10px] text-muted-foreground leading-4 line-clamp-2 max-w-[90px]"
      title={task.assignee.name}
    >
      {task.assignee.name}
    </span>
  </div>
)}
      </div>

      {/* Project name */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-slate-400 truncate">
          {task.project?.name}
        </p>
      </div>
    </div>
  )
}