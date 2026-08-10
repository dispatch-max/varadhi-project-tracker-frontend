'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts'

const data = [
  { name: 'Completed', value: 98, color: '#10b981' },
  { name: 'In Progress', value: 41, color: '#2563eb' },
  { name: 'To Do', value: 32, color: '#d1d5db' },
  { name: 'Overdue', value: 8, color: '#ef4444' },
]

const totalTasks = 156

export function TaskOverview() {
  return (
    <div className="h-[220px] rounded-xl border border-border bg-card p-4">
      
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          Task Overview
        </h3>

        <button className="text-xs font-medium text-violet-600">
          View Full Report
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">

        {/* Chart */}
        <div className="relative h-40 w-40">

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                innerRadius={45}
                outerRadius={65}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((item) => (
                  <Cell
                    key={item.name}
                    fill={item.color}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">
              {totalTasks}
            </span>

            <span className="text-xs text-muted-foreground">
              Total Tasks
            </span>
          </div>

        </div>

        {/* Legend */}
        <div className="flex-1 space-y-3">

          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{
                    backgroundColor: item.color,
                  }}
                />

                <span className="text-sm text-muted-foreground">
                  {item.name}
                </span>
              </div>

              <span className="text-sm font-medium text-foreground">
                {item.value}
                {' '}
                (
                {Math.round(
                  (item.value / totalTasks) * 100
                )}
                %)
              </span>
            </div>
          ))}

        </div>

      </div>

    </div>
  )
}