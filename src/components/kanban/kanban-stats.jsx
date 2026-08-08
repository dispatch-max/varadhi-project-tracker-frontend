'use client'

import {
  ClipboardList,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from 'lucide-react'

export function KanbanStats() {
  const stats = [
    {
      title: 'Total Tasks',
      value: 156,
      change: '+12 this week',
      icon: ClipboardList,
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
    {
      title: 'In Progress',
      value: 41,
      change: '26% of total',
      icon: Clock3,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Review',
      value: 23,
      change: '15% of total',
      icon: CheckCircle2,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      title: 'Completed',
      value: 82,
      change: '53% of total',
      icon: CheckCircle2,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
    },

  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon

        return (
          <div
            key={stat.title}
            className="bg-card border border-border rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {stat.title}
                </p>

                <h3 className="text-3xl font-bold text-foreground mt-1">
                  {stat.value}
                </h3>

                <p className="text-xs text-green-600 mt-1">
                  {stat.change}
                </p>
              </div>

              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg}`}
              >
                <Icon
                  className={`w-5 h-5 ${stat.iconColor}`}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}