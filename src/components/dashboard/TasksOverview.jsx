'use client'

import { Card } from '@/components/ui/card'
import { MoreHorizontal } from 'lucide-react'

const progress = 62

const stats = [
  { label: 'To Do', value: 48 },
  { label: 'In Progress', value: 52 },
  { label: 'Completed', value: 31 },
]

export function TasksOverview() {
  return (
    <Card className="h-[360px] rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">

      <div className="flex items-center justify-between px-6 pt-5">
        <h3 className="text-sm font-semibold text-foreground">
          Tasks Overview
        </h3>

        <MoreHorizontal className="h-4 w-4 text-slate-400" />
      </div>

      <div className="px-6 mt-4">
        <p className="text-sm text-muted-foreground">
          Total Tasks
        </p>

        <div className="flex flex-wrap items-end gap-3 mt-2">
          <h2 className="text-5xl font-bold">
            156
          </h2>

          <span className="text-sm text-green-600">
            +24 this week
          </span>
        </div>
      </div>

      <div className="px-6 mt-6">
        <div className="h-6 rounded-full bg-slate-200 overflow-hidden">
          <div
            className="flex h-full items-center justify-end rounded-full bg-gradient-to-r from-violet-600 to-cyan-400 pr-3"
            style={{ width: `${progress}%` }}
          >
            <span className="text-xs font-medium text-white">
              {progress}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto grid grid-cols-3 border-t border-slate-100">
        {stats.map((item) => (
          <div
            key={item.label}
            className="py-5 text-center"
          >
            <p className="text-xs text-muted-foreground">
              {item.label}
            </p>

            <h3 className="mt-1 text-2xl font-bold">
              {item.value}
            </h3>
          </div>
        ))}
      </div>

    </Card>
  )
}