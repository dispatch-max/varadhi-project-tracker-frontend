'use client'

import {
  Sparkles,
  TrendingUp,
  Calendar,
  Target,
} from 'lucide-react'

export function AIForecastingCard() {
  const forecasts = [
    {
      title: 'Sprint Completion',
      value: '92%',
      subtitle: 'Expected by deadline',
      icon: Target,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      title: 'Productivity Trend',
      value: '+15%',
      subtitle: 'Next 2 weeks',
      icon: TrendingUp,
      color: 'text-violet-600',
      bg: 'bg-violet-50',
    },
    {
      title: 'Resource Demand',
      value: 'High',
      subtitle: 'Upcoming sprint',
      icon: Calendar,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            AI Forecasting
          </h3>

          <p className="text-sm text-muted-foreground">
            Predictive analytics and future trends
          </p>
        </div>

        <Sparkles className="w-5 h-5 text-violet-600" />
      </div>

      <div className="space-y-4">
        {forecasts.map((forecast) => {
          const Icon = forecast.icon

          return (
            <div
              key={forecast.title}
              className={`flex items-center gap-4 p-4 rounded-xl ${forecast.bg}`}
            >
              <div
                className={`w-10 h-10 rounded-lg bg-card flex items-center justify-center`}
              >
                <Icon className={`w-5 h-5 ${forecast.color}`} />
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {forecast.title}
                </p>

                <p className="text-xs text-muted-foreground">
                  {forecast.subtitle}
                </p>
              </div>

              <div
                className={`text-lg font-bold ${forecast.color}`}
              >
                {forecast.value}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-5 p-4 rounded-xl bg-violet-50 border border-violet-100">
        <p className="text-sm font-medium text-violet-700">
          AI Recommendation
        </p>

        <p className="text-xs text-muted-foreground mt-1">
          Reassign 2 overdue tasks to available team members to
          improve sprint completion probability by approximately 8%.
        </p>
      </div>
    </div>
  )
}