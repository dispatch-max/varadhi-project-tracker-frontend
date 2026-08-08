'use client'

import { Trophy } from 'lucide-react'

export function TopPerformersCard() {
  const performers = [
    {
      name: 'John Doe',
      tasks: 24,
      score: '92%',
      initials: 'JD',
      color: 'bg-violet-500',
    },
    {
      name: 'Sarah Wilson',
      tasks: 19,
      score: '85%',
      initials: 'SW',
      color: 'bg-green-500',
    },
    {
      name: 'David Kumar',
      tasks: 17,
      score: '78%',
      initials: 'DK',
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-green-500" />
          <h3 className="text-sm font-semibold text-foreground">
            Top Performers
          </h3>
        </div>

        <button className="text-xs font-medium text-violet-600 hover:text-violet-700">
          View All
        </button>
      </div>

      <div className="space-y-4">
        {performers.map((member) => (
          <div
            key={member.name}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold ${member.color}`}
              >
                {member.initials}
              </div>

              <div>
                <p className="text-sm font-medium text-foreground">
                  {member.name}
                </p>

                <p className="text-xs text-muted-foreground">
                  {member.tasks} tasks completed
                </p>
              </div>
            </div>

            <span className="px-2 py-1 rounded-md bg-green-100 text-green-700 text-xs font-semibold">
              {member.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}