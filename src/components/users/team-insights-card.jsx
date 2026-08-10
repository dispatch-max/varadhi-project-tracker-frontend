'use client'

import {
  Users,
  TrendingUp,
  Briefcase,
  CheckCircle2
} from 'lucide-react'

export function TeamInsightsCard() {
  const stats = [
    {
      title: 'Total Members',
      value: '48',
      icon: Users,
      color: 'bg-violet-100 text-violet-600',
    },
    {
      title: 'Active Members',
      value: '42',
      icon: CheckCircle2,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Productivity',
      value: '87%',
      icon: TrendingUp,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Projects',
      value: '12',
      icon: Briefcase,
      color: 'bg-orange-100 text-orange-600',
    },
  ]

  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">
          Team Insights
        </h3>

        <p className="text-sm text-muted-foreground mt-1">
          Overview of workforce performance and engagement
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((item) => {
          const Icon = item.icon

          return (
            <div
              key={item.title}
              className="border border-slate-100 rounded-xl p-4"
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${item.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <p className="text-2xl font-bold text-foreground">
                {item.value}
              </p>

              <p className="text-sm text-muted-foreground mt-1">
                {item.title}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}