'use client'

import { Calendar } from 'lucide-react'

export function UpcomingDeadlinesCard() {
  const tasks = [
    {
      title: 'Design new dashboard UI',
      date: 'May 22',
      days: '3 days left',
    },
    {
      title: 'API Integration',
      date: 'May 24',
      days: '5 days left',
    },
    {
      title: 'Payment Gateway',
      date: 'May 24',
      days: '5 days left',
    },
    {
      title: 'Prepare Sprint Report',
      date: 'May 25',
      days: '6 days left',
    },
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">
          Upcoming Deadlines
        </h3>

        <button className="text-xs text-violet-600">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.title}
            className="flex items-center justify-between"
          >
            <div className="flex gap-2">
              <Calendar className="w-4 h-4 text-violet-500 mt-1" />

              <div>
                <p className="text-sm text-foreground">
                  {task.title}
                </p>

                <p className="text-xs text-slate-400">
                  {task.date}
                </p>
              </div>
            </div>

            <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-md">
              {task.days}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}