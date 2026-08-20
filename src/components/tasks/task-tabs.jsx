'use client'

// Only scopes the backend actually supports are offered. `getAllTasks`
// filters on assigneeId, so "My Tasks" is real; there is no reporter or
// follower filter on the endpoint, so those tabs are not shown rather than
// rendered as buttons that silently do nothing.
export const TASK_SCOPES = [
  { key: 'all', label: 'All Tasks' },
  { key: 'mine', label: 'My Tasks' },
]

export function TaskTabs({ active = 'all', onChange }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
      <div className="flex items-center gap-8 overflow-x-auto">
        {TASK_SCOPES.map((tab) => {
          const isActive = tab.key === active
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange?.(tab.key)}
              aria-pressed={isActive}
              className={`
                whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors
                ${
                  isActive
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
