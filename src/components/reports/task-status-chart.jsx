'use client'

import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

import { reportsApi } from '@/lib/api/reports.api'

// const DATA = [
//   { name: 'Completed', value: 38, color: '#22c55e' },
//   { name: 'In Progress', value: 14, color: '#f59e0b' },
//   { name: 'In Review',   value: 7,  color: '#3b82f6' },
//   { name: 'To Do',       value: 5,  color: '#94a3b8' },
// ]

function ChartState({ children }) {
  return (
    <div className="h-[260px] flex items-center justify-center text-xs text-slate-400">
      {children}
    </div>
  )
}

export function TaskStatusChart() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
 
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await reportsApi.getTaskStatus()
        if (active) setData(Array.isArray(res) ? res : [])
      } catch (err) {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])
 
  const hasData = data.some((d) => (d.value || 0) > 0)


  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">
        Tasks by Status
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Overall task distribution
      </p>
            {loading ? (
        <ChartState>Loading…</ChartState>
      ) : error ? (
        <ChartState>Couldn&apos;t load chart data.</ChartState>
      ) : !hasData ? (
        <ChartState>No tasks yet.</ChartState>
      ) : (
        
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} tasks`, name]}
            contentStyle={{
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      )}
    </div>
  )
}