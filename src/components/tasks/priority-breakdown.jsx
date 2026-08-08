'use client'

import { Card } from '@/components/ui/card'

export function PriorityBreakdown() {
  return (
    <Card className="h-[160px] rounded-2xl border border-border bg-card p-5 shadow-sm">

      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Priority Breakdown
        </h3>

        <button className="text-xs font-medium text-violet-600">
          View Details
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">

        {/* High */}
        <div className="rounded-xl border border-red-100 bg-red-50 p-3">
          <div className="flex items-center gap-1">
            <p className="text-xs text-red-600">High</p>
            <span className="h-2 w-2 rounded-full bg-red-500" />
          </div>

          <div className="mt-2 flex items-end justify-between">
            <h4 className="text-2xl font-bold text-foreground">
              59
            </h4>

            <p className="text-xs font-medium text-red-500">
              38%
            </p>
          </div>
        </div>

        {/* Medium */}
        <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-3">
          <div className="flex items-center gap-1">
            <p className="text-xs text-yellow-700">Medium</p>
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
          </div>

          <div className="mt-2 flex items-end justify-between">
            <h4 className="text-2xl font-bold text-foreground">
              67
            </h4>

            <p className="text-xs font-medium text-yellow-600">
              43%
            </p>
          </div>
        </div>

        {/* Low */}
        <div className="rounded-xl border border-green-100 bg-green-50 p-3">
          <div className="flex items-center gap-1">
            <p className="text-xs text-green-700">Low</p>
            <span className="h-2 w-2 rounded-full bg-green-500" />
          </div>

          <div className="mt-2 flex items-end justify-between">
            <h4 className="text-2xl font-bold text-foreground">
              30
            </h4>

            <p className="text-xs font-medium text-green-600">
              19%
            </p>
          </div>
        </div>

      </div>

    </Card>
  )
}