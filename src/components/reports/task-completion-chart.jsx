'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts'

export function TaskCompletionChart() {
  const data = [
    {
      name: 'Completed',
      value: 98,
      color: '#7C3AED'
    },
    {
      name: 'In Progress',
      value: 41,
      color: '#10B981'
    },
    {
      name: 'Blocked',
      value: 9,
      color: '#F59E0B'
    },
    {
      name: 'Overdue',
      value: 8,
      color: '#EF4444'
    }
  ]

  const totalTasks = data.reduce(
    (sum, item) => sum + item.value,
    0
  )

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Task Completion Analytics
          </h3>

          <p className="text-sm text-muted-foreground">
            Overall task distribution
          </p>
        </div>

        <button className="text-violet-600 text-sm font-medium">
          View Details
        </button>
      </div>

      <div className="flex items-center justify-between">
        {/* Donut Chart */}
        <div className="relative w-60 h-60">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                innerRadius={70}
                outerRadius={95}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.color}
                  />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold text-foreground">
              {totalTasks}
            </p>

            <p className="text-sm text-muted-foreground">
              Total Tasks
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-4">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between gap-8"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: item.color
                  }}
                />

                <span className="text-sm text-foreground">
                  {item.name}
                </span>
              </div>

              <span className="text-sm font-medium text-muted-foreground">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}