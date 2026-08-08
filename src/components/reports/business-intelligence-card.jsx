'use client'

import {
  TrendingUp,
  TrendingDown,
  BarChart3,
} from 'lucide-react'

export function BusinessIntelligenceCard() {
  const metrics = [
    {
      title: 'Productivity',
      value: '+18%',
      trend: 'up',
    },
    {
      title: 'Efficiency',
      value: '+12%',
      trend: 'up',
    },
    {
      title: 'Risk Score',
      value: '-5%',
      trend: 'down',
    },
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Business Intelligence
          </h3>

          <p className="text-sm text-muted-foreground">
            Key performance indicators
          </p>
        </div>

        <BarChart3 className="w-5 h-5 text-violet-500" />
      </div>

      <div className="space-y-4">
        {metrics.map((metric) => (
          <div
            key={metric.title}
            className="flex items-center justify-between p-3 rounded-lg bg-background"
          >
            <span className="text-sm font-medium text-foreground">
              {metric.title}
            </span>

            <div className="flex items-center gap-2">
              {metric.trend === 'up' ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}

              <span
                className={`text-sm font-semibold ${
                  metric.trend === 'up'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {metric.value}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}