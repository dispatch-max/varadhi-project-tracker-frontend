import { cn } from '@/utils'
import {
  TASK_STATUS_COLORS, TASK_STATUS_LABELS,
  TASK_PRIORITY_COLORS, TASK_PRIORITY_LABELS,
  TASK_TYPE_COLORS, TASK_TYPE_LABELS,
} from '@/constants'

export function StatusBadge({ status }) {
  return (
    <span className={cn(
      'text-xs px-2 py-0.5 rounded-md font-medium',
      TASK_STATUS_COLORS[status]
    )}>
      {TASK_STATUS_LABELS[status]}
    </span>
  )
}

export function PriorityBadge({ priority }) {
  return (
    <span className={cn(
      'text-xs px-2 py-0.5 rounded-md font-medium',
      TASK_PRIORITY_COLORS[priority]
    )}>
      {TASK_PRIORITY_LABELS[priority]}
    </span>
  )
}

export function TypeBadge({ type }) {
  return (
    <span className={cn(
      'text-xs px-2 py-0.5 rounded-md font-medium',
      TASK_TYPE_COLORS[type]
    )}>
      {TASK_TYPE_LABELS[type]}
    </span>
  )
}