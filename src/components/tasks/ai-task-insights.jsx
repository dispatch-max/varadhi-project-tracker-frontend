'use client'

import { Card } from '@/components/ui/card'
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'

export function AiTaskInsights() {
  return (
    <Card className="h-[220px] rounded-2xl border border-violet-100 bg-violet-50 p-5 shadow-sm">

      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          AI Task Insights
        </h3>

        <Sparkles className="h-4 w-4 text-violet-600" />
      </div>

      {/* Insights */}
      <div className="space-y-3">

        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-orange-500" />

          <p className="text-xs text-muted-foreground">
            8 overdue tasks require immediate attention.
          </p>
        </div>

        <div className="flex gap-3">
          <TrendingUp className="mt-0.5 h-4 w-4 text-green-500" />

          <p className="text-xs text-muted-foreground">
            Team productivity increased by 15% this week.
          </p>
        </div>

        <div className="flex gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 text-violet-500" />

          <p className="text-xs text-muted-foreground">
            Frontend tasks take 20% longer than estimated.
          </p>
        </div>

      </div>

      {/* Buttons */}
      <div className="mt-4 grid grid-cols-2 gap-3">

        <button className="rounded-lg bg-violet-600 py-2 text-xs font-medium text-white hover:bg-violet-700">
          View Insights
        </button>

        <button className="rounded-lg border border-violet-200 bg-card py-2 text-xs font-medium text-violet-700 hover:bg-violet-50">
          Ask AI
        </button>

      </div>

    </Card>
  )
}