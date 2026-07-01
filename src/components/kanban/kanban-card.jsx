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
        'bg-white rounded-xl border border-slate-200 p-3.5 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all',
        isDragging && 'opacity-50 shadow-lg scale-105 rotate-1'
      )}
    >
      {/* Type + Priority */}
      <div className="flex items-center gap-1.5 mb-2.5 flex-wrap">
        <TypeBadge type={task.type} />
        <PriorityBadge priority={task.priority} />
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-slate-800 leading-snug mb-2.5">
        {task.title}
      </p>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-400 line-clamp-2 mb-2.5 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-1">

        {/* Due date */}
        {task.dueDate ? (
          <div className={cn(
            'flex items-center gap-1 text-xs',
            overdue ? 'text-red-500' : 'text-slate-400'
          )}>
            {overdue
              ? <AlertTriangle className="w-3 h-3" />
              : <Calendar className="w-3 h-3" />
            }
            <span>{formatDate(task.dueDate, 'MMM dd')}</span>
          </div>
        ) : (
          <span />
        )}

        {/* Assignee avatar */}
        {task.assignee && (
          <div
            title={task.assignee.name}
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold',
              getAvatarColor(task.assignee.name)
            )}
          >
            {getInitials(task.assignee.name)}
          </div>
        )}
      </div>

      {/* Project name */}
      <div className="mt-2 pt-2 border-t border-slate-100">
        <p className="text-xs text-slate-400 truncate">
          {task.project?.name}
        </p>
      </div>
    </div>
  )
}