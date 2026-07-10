'use client'
import { useState, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'
import { reportsApi } from '@/lib/api/reports.api'



function ChartState({ children }) {
  return (
    <div className="h-[260px] flex items-center justify-center text-xs text-slate-400">
      {children}
    </div>
  )
}

export function MemberWorkloadChart() {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)
  
    useEffect(() => {
      let active = true
      async function load() {
        try {
          const res = await reportsApi.getMemberWorkload()
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">
        Member Workload
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Task distribution per team member
      </p>

      {loading ? (
        <ChartState>Loading…</ChartState>
      ) : error ? (
        <ChartState>Couldn&apos;t load chart data.</ChartState>
      ) : data.length === 0 ? (
        <ChartState>No members to display.</ChartState>
      ) : (
        
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} barSize={18}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: '12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
            }}
            formatter={(value, name) => [
              `${value} tasks`,
              name === 'completed'
                ? 'Completed'
                : name === 'inProgress'
                ? 'In Progress'
                : 'To Do',
            ]}
          />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {value === 'completed'
                  ? 'Completed'
                  : value === 'inProgress'
                  ? 'In Progress'
                  : 'To Do'}
              </span>
            )}
          />
          <Bar dataKey="completed"  fill="#22c55e" radius={[4,4,0,0]} />
          <Bar dataKey="inProgress" fill="#f59e0b" radius={[4,4,0,0]} />
          <Bar dataKey="todo"       fill="#94a3b8" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
      )}
    </div>
  )
}