'use client'

import { Card } from '@/components/ui/card'
import { CalendarDays } from 'lucide-react'

const deadlines = [
  {
    task: 'Design new dashboard UI',
    date: 'May 22, 2025',
    daysLeft: '3 days left',
  },
  {
    task: 'API Integration Phase 2',
    date: 'May 24, 2025',
    daysLeft: '5 days left',
  },
  {
    task: 'Prepare sprint report',
    date: 'May 23, 2025',
    daysLeft: '4 days left',
  },
]

export function UpcomingDeadlines() {
  return (
    <Card className="h-[200px] rounded-2xl border border-border bg-card p-5 shadow-sm">

      <div className="mb-4 flex items-center justify-between"> 
        <h3 className="text-sm font-semibold text-foreground">
          Upcoming Deadlines
        </h3>

        <button className="text-xs font-medium text-violet-600 hover:text-violet-700">
          View All
        </button>
      </div>

      <div className="space-y-3">

        {deadlines.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between"
          >
            <div className="flex items-start gap-3">

              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50">
                <CalendarDays className="h-3.5 w-3.5 text-violet-600" />
              </div>

              <div>
                <p className="text-xs font-medium text-foreground">
                  {item.task}
                </p>

                <p className="text-[11px] text-slate-400">
                  {item.date}
                </p>
              </div>

            </div>

            <span className="text-[11px] font-medium text-orange-500">
              {item.daysLeft}
            </span>
          </div>
        ))}

      </div>

    </Card>
  )
}