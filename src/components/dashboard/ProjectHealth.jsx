'use client'

import { Card } from '@/components/ui/card'
import { MoreHorizontal } from 'lucide-react'
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from 'recharts'

const chartData = [
  {
    value: 84,
    fill: '#7C3AED',
  },
]

const projects = [
  {
    name: 'Portal Redesign',
    status: 'On Track',
    color: 'bg-green-500',
    text: 'text-green-600',
  },
  {
    name: 'API Integration',
    status: 'At Risk',
    color: 'bg-amber-500',
    text: 'text-amber-600',
  },
  {
    name: 'Mobile App V2',
    status: 'Delayed',
    color: 'bg-red-500',
    text: 'text-red-600',
  },
]

export function ProjectHealth() {
  return (
   <Card className="min-h-[360px] rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">

      <div className="flex items-center justify-between px-6 pt-5">
        <h3 className="text-sm font-semibold text-foreground">
          Project Health Overview
        </h3>

        <MoreHorizontal className="h-4 w-4 text-slate-400 cursor-pointer" />
      </div>

      <div className="flex justify-center py-2">
        <RadialBarChart
          width={140}
          height={140}
          data={chartData}
          innerRadius="68%"
          outerRadius="88%"
          startAngle={90}
          endAngle={-270}
          barSize={12}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            tick={false}
          />

          <RadialBar
            dataKey="value"
            cornerRadius={20}
            background={{ fill: '#ECEEF3' }}
          />

          <text
            x="50%"
            y="47%"
            textAnchor="middle"
            className="fill-slate-500 text-[11px]"
          >
            Overall Health
          </text>

          <text
            x="50%"
            y="61%"
            textAnchor="middle"
            className="fill-slate-900 text-lg md:text-xl xl:text-2xl font-bold"
          >
            84%
          </text>
        </RadialBarChart>
      </div>

      <div className="mt-auto px-4 pb-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {projects.map((project) => (
          <div key={project.name} className="contents">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`h-2.5 w-2.5 rounded-full ${project.color}`} />
              <span className="truncate text-muted-foreground text-sm">
                {project.name}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${project.color}`} />
             <span className={`${project.text} whitespace-nowrap`}>
  {project.status}
</span>
            </div>
          </div>
        ))}
      </div>

    </Card>
  )
}