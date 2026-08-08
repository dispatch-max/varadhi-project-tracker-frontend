'use client'

import { Card } from '@/components/ui/card'
import { MoreHorizontal } from 'lucide-react'

const deadlines = [
  {
    date: 'Today',
    task: 'Finalize UI Components',
    priority: 'High Priority',
  },
  {
    date: 'Tomorrow',
    task: 'API Endpoint Testing',
    priority: 'Medium Priority',
  },
  {
    date: 'Oct 18, 2026',
    task: 'Sprint Planning',
    priority: 'Medium Priority',
  },
  {
    date: 'Oct 20, 2026',
    task: 'User Acceptance Testing',
    priority: 'Low Priority',
  },
  {
    date: 'Oct 22, 2026',
    task: 'Production Deploy',
    priority: 'Low Priority',
  },
]

export function UpcomingDeadlines() {
  const getBadgeStyle = (priority) => {
    if (priority === 'High Priority') {
      return 'bg-red-100 text-red-600'
    }

    if (priority === 'Medium Priority') {
      return 'bg-yellow-100 text-yellow-700'
    }

    return 'bg-green-100 text-green-600'
  }

  return (
<Card className="h-[360px] rounded-2xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="text-sm font-semibold text-foreground">
          Upcoming Deadlines
        </h3>

        <MoreHorizontal className="h-4 w-4 text-slate-400" />
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100">
        {deadlines.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between px-5 py-3"
          >
            <div className="w-28 text-sm text-muted-foreground">
              {item.date}
            </div>

            <div className="flex-1 text-sm font-medium text-foreground">
              {item.task}
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${getBadgeStyle(
                item.priority
              )}`}
            >
              {item.priority}
            </span>
          </div>
        ))}
      </div>
    </Card>
  )
}