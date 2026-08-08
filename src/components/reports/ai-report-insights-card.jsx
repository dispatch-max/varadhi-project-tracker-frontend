'use client'

import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Lightbulb
} from 'lucide-react'

export function AIReportInsightsCard() {
  const insights = [
    {
      icon: TrendingUp,
      text: 'Team productivity increased by 18% this sprint.',
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: AlertTriangle,
      text: '3 tasks are at risk of missing deadlines.',
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      icon: Lightbulb,
      text: 'Reallocating QA resources could improve delivery speed.',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
  ]

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            AI Report Insights
          </h3>

          <p className="text-sm text-muted-foreground">
            Smart recommendations and predictions
          </p>
        </div>

        <Sparkles className="w-5 h-5 text-violet-600" />
      </div>

      <div className="space-y-3">
        {insights.map((item, index) => {
          const Icon = item.icon

          return (
            <div
              key={index}
              className={`flex gap-3 p-3 rounded-lg ${item.bg}`}
            >
              <Icon className={`w-4 h-4 mt-0.5 ${item.color}`} />

              <p className="text-sm text-foreground">
                {item.text}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}