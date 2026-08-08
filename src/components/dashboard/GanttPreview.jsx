'use client'

import {
  CalendarDays,
  MoreHorizontal,
  Flag,
} from 'lucide-react'

const tasks = [
  {
    name: 'Design System',
    start: 'Oct 14',
    end: 'Oct 18',
    left: '18%',
    width: '26%',
    color:
      'bg-gradient-to-r from-indigo-600 to-violet-500',
  },
  {
    name: 'API Development',
    start: 'Oct 16',
    end: 'Oct 23',
    left: '38%',
    width: '30%',
    color:
      'bg-gradient-to-r from-violet-600 to-purple-500',
  },
  {
    name: 'Frontend Integration',
    start: 'Oct 18',
    end: 'Oct 25',
    left: '48%',
    width: '28%',
    color:
      'bg-gradient-to-r from-emerald-500 to-teal-400',
  },
  {
    name: 'Testing & QA',
    start: 'Oct 23',
    end: 'Oct 30',
    left: '68%',
    width: '26%',
    color:
      'bg-gradient-to-r from-indigo-500 to-violet-400',
  },
]

export function GanttPreview() {
  return (
    <div
      className="
        relative
        h-[320px]
        overflow-hidden
        rounded-3xl
        border border-white/30
        bg-gradient-to-br
        from-violet-100/80
        via-purple-50/60
        to-blue-100/70
        p-6
        backdrop-blur-xl
        shadow-[0_8px_32px_rgba(139,92,246,0.15)]
        flex flex-col
      "
    >
      {/* Glow */}
      <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-violet-300/20 blur-3xl" />

      {/* Header */}
      <div className="relative z-10 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-500">
            <CalendarDays className="h-4 w-4 text-white" />
          </div>

          <h3 className="text-lg font-semibold text-foreground">
            Gantt Timeline Preview
          </h3>
        </div>

        <MoreHorizontal className="h-4 w-4 cursor-pointer text-slate-400" />
      </div>

      {/* Timeline */}
      <div className="relative flex-1 rounded-2xl border border-white/50 bg-card/60 backdrop-blur-md">

        {/* Header Dates */}
        <div className="grid grid-cols-4 border-b border-border text-center text-xs text-muted-foreground">
          <div className="py-3">Oct 14</div>
          <div className="py-3">Oct 18</div>
          <div className="py-3">Oct 24</div>
          <div className="py-3">Nov 01</div>
        </div>

        {/* Vertical Grid */}
        <div className="absolute inset-0 top-10 grid grid-cols-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border-r border-slate-100"
            />
          ))}
        </div>

        {/* Horizontal Grid */}
        <div className="absolute inset-0 top-10 flex flex-col">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 border-b border-slate-100"
            />
          ))}
        </div>

        {/* Task Labels */}
        <div className="absolute left-4 top-14 flex flex-col gap-[30px] text-xs font-medium text-muted-foreground">
          {tasks.map((task) => (
            <span key={task.name}>
              {task.name}
            </span>
          ))}
        </div>

        {/* Bars */}
        <div className="absolute inset-0 top-12">

          {tasks.map((task, index) => (
            <div
              key={task.name}
              className={`
                absolute
                flex
                h-7
                items-center
                justify-between
                rounded-full
                px-3
                text-[10px]
                font-medium
                text-white
                shadow-md
                ${task.color}
              `}
              style={{
                top: `${index * 38 + 4}px`,
                left: task.left,
                width: task.width,
              }}
            >
              <div className="flex items-center gap-1">
                <Flag className="h-3 w-3" />
                <span className="truncate">
                  {task.name}
                </span>
              </div>

              <span className="ml-2 whitespace-nowrap text-[9px]">
                {task.start} – {task.end}
              </span>
            </div>
          ))}

        </div>
      </div>
    </div>
  )
}