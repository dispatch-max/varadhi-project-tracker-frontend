'use client'

import { Card } from '@/components/ui/card'
import { MoreHorizontal } from 'lucide-react'

const days = [
  { label: '1', date: '16' },
  { label: '2', date: '17' },
  { label: '3', date: '18', active: true },
  { label: '4', date: '19', active: true },
  { label: '6', date: '20', active: true },
  { label: '9', date: '21' },
  { label: '5', date: '22' },
]

const events = [
  { date: '16 Oct', title: 'Sprint Planning' },
  { date: '17 Oct', title: 'Design Review' },
  { date: '18 Oct', title: 'UAT Kickoff' },
  { date: '19 Oct', title: 'Backlog Refinement' },
]

export function CalendarCard() {
  return (
    <Card className="min-h-[320px] rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5">
        <h3 className="text-sm font-semibold text-foreground">
          Calendar Sync
        </h3>

        <MoreHorizontal className="h-4 w-4 cursor-pointer text-slate-400" />
      </div>

      {/* Calendar */}
      <div className="px-6 pt-6">
        <div className="grid grid-cols-7 gap-3">
          {days.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center"
            >
              <span className="mb-2 text-xs text-slate-400">
                {item.label}
              </span>

<div
  className={`flex aspect-square w-full max-w-10 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200
    ${
      item.active
        ? 'bg-violet-600 text-white'
        : 'bg-slate-100 text-muted-foreground'
    }`}
>
                {item.date}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Events */}
      <div className="mt-auto grid grid-cols-2 gap-x-6 gap-y-5 px-6 pb-5 text-sm">
        {events.map((event, index) => (
          <div key={index}>
            <p className="font-semibold text-foreground">
              {event.date}
            </p>

            <p className="mt-1 text-muted-foreground">
              {event.title}
            </p>
          </div>
        ))}
      </div>

    </Card>
  )
}