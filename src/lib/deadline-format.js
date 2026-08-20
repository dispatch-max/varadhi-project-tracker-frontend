// Shared formatting for the three "upcoming deadlines" cards (dashboard,
// tasks sidebar, kanban). They render different chrome but agree on how a
// due date and priority should read, so the logic lives here once.

// `daysLeft` is computed server-side against midnight boundaries, so 0 means
// "due today" regardless of the time component.
export function formatDueLabel(daysLeft, dueDate) {
  if (daysLeft === 0) return 'Today'
  if (daysLeft === 1) return 'Tomorrow'
  if (daysLeft === -1) return 'Yesterday'
  if (daysLeft < 0) return `${Math.abs(daysLeft)} days overdue`
  if (daysLeft <= 7) return `${daysLeft} days left`

  if (!dueDate) return `${daysLeft} days left`
  const d = new Date(dueDate)
  if (Number.isNaN(d.getTime())) return `${daysLeft} days left`
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const PRIORITY_BADGES = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-red-100 text-red-600',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-600',
}

export function priorityBadgeClass(priority) {
  return PRIORITY_BADGES[priority] ?? 'bg-slate-100 text-slate-600'
}

export function priorityLabel(priority) {
  if (!priority) return 'No Priority'
  return `${priority.charAt(0).toUpperCase()}${priority.slice(1)} Priority`
}
