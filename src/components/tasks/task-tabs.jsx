'use client'

const tabs = [
  'All Tasks',
  'My Tasks',
  'Assigned To Me',
  'Created By Me',
  'Following',
]

export function TaskTabs() {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-4 shadow-sm">
      <div className="flex items-center gap-8 overflow-x-auto">

        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={`
              whitespace-nowrap
              border-b-2
              pb-3
              text-sm
              font-medium
              transition-colors
              ${
                index === 0
                  ? 'border-violet-600 text-violet-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {tab}
          </button>
        ))}

      </div>
    </div>
  )
}