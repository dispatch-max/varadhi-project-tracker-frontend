'use client'

import { Sparkles } from 'lucide-react'

export function AIInsightsCard() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-violet-600" />
        <h3 className="font-semibold text-foreground">
          AI Insights
        </h3>
      </div>

      <ul className="space-y-3 text-sm text-muted-foreground">
        <li>8 tasks are at risk of delay.</li>
        <li>Mobile App Development is 15% behind schedule.</li>
        <li>Team productivity increased by 12% this week.</li>
        <li>Consider moving 5 tasks to "Done".</li>
      </ul>

      <div className="flex gap-3 mt-6">
        <button className="flex-1 bg-violet-600 text-white rounded-lg py-2 text-sm">
          View Insights
        </button>

        <button className="flex-1 border rounded-lg py-2 text-sm">
          Ask AI
        </button>
      </div>
    </div>
  )
}