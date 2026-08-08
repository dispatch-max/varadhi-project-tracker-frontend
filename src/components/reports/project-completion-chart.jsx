'use client'


import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'
import { calcProgress } from '@/utils'
import { reportsApi } from '@/lib/api/reports.api'

// const PROJECTS = [
//   { name: 'Tracker Frontend', completed: 12, total: 20 },
//   { name: 'Tracker Backend',  completed: 8,  total: 18 },
//   { name: 'Mobile App v2',    completed: 5,  total: 15 },
//   { name: 'Admin Dashboard',  completed: 24, total: 24 },
//   { name: 'Notification Svc', completed: 3,  total: 10 },
// ]

// const DATA = PROJECTS.map((p) => ({
//   name: p.name,
//   progress: calcProgress(p.completed, p.total),
// }))

function getBarColor(progress) {
  if (progress === 100) return '#22c55e'
  if (progress >= 60)  return '#7c3aed'
  if (progress >= 30)  return '#f59e0b'
  return '#ef4444'
}

function ChartState({ children }) {
  return (
    <div className="h-[260px] flex items-center justify-center text-xs text-slate-400">
      {children}
    </div>
  )
}

export function ProjectCompletionChart() {

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
 
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await reportsApi.getProjectCompletion()
        const list = Array.isArray(res) ? res : []
        // Keep the existing { name, progress } shape the chart renders
        const mapped = list.map((p) => ({
          name: p.name,
          progress: calcProgress(p.completed, p.total),
        }))
        if (active) setData(mapped)
      } catch (err) {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  return (
    <div className="bg-card rounded-xl border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground mb-1">
        Project Completion
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        % complete per project
      </p>
      {loading ? (
        <ChartState>Loading…</ChartState>
      ) : error ? (
        <ChartState>Couldn&apos;t load chart data.</ChartState>
      ) : data.length === 0 ? (
        <ChartState>No projects to display.</ChartState>
      ) : (

      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          layout="vertical"
          barSize={16}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip
            formatter={(value) => [`${value}%`, 'Progress']}
            contentStyle={{
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          />
          <Bar dataKey="progress" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={getBarColor(entry.progress)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      )}
    </div>
  )
}