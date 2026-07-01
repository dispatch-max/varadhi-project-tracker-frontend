'use client'
import { useState, useEffect } from 'react'

import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from 'recharts'
import { dashboardApi } from '@/lib/api/dashboard.api'
import { projectsApi } from '@/lib/api/projects.api'

// const DATA = [
//   { day: 'Day 1',  ideal: 40, actual: 40 },
//   { day: 'Day 2',  ideal: 37, actual: 38 },
//   { day: 'Day 3',  ideal: 34, actual: 35 },
//   { day: 'Day 4',  ideal: 31, actual: 34 },
//   { day: 'Day 5',  ideal: 28, actual: 30 },
//   { day: 'Day 6',  ideal: 25, actual: 26 },
//   { day: 'Day 7',  ideal: 22, actual: 24 },
//   { day: 'Day 8',  ideal: 19, actual: 20 },
//   { day: 'Day 9',  ideal: 16, actual: null },
//   { day: 'Day 10', ideal: 13, actual: null },
//   { day: 'Day 11', ideal: 10, actual: null },
//   { day: 'Day 12', ideal: 7,  actual: null },
//   { day: 'Day 13', ideal: 4,  actual: null },
//   { day: 'Day 14', ideal: 0,  actual: null },
// ]

function ChartState({ children }) {
  return (
    <div className="h-[260px] flex items-center justify-center text-xs text-slate-400">
      {children}
    </div>
  )
}

export function BurndownChart() {
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
 
  // Load projects once, default to the first one
  useEffect(() => {
    let active = true
    async function loadProjects() {
      try {
        const res = await projectsApi.getAll()
        const list = res?.data ?? res ?? []
        const arr = Array.isArray(list) ? list : []
        if (active) {
          setProjects(arr)
          if (arr.length > 0) setProjectId(arr[0].id)
          else setLoading(false) // nothing to fetch a burndown for
        }
      } catch (err) {
        if (active) {
          setError(true)
          setLoading(false)
        }
      }
    }
    loadProjects()
    return () => { active = false }
  }, [])
 
  // Load burndown whenever the selected project changes
  useEffect(() => {
    if (!projectId) return
    let active = true
    async function loadBurndown() {
      setLoading(true)
      setError(false)
      try {
        const res = await dashboardApi.getBurndown(projectId)
        if (active) setData(Array.isArray(res) ? res : [])
      } catch (err) {
        if (active) setError(true)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadBurndown()
    return () => { active = false }
  }, [projectId])
 
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
      <h3 className="text-sm font-semibold text-slate-800 mb-1">
        Sprint Burndown
      </h3>
              {projects.length > 0 && (
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}
      </div>
      
      <p className="text-xs text-slate-400 mb-4">
        Ideal vs actual progress
      </p>
            {loading ? (
        <ChartState>Loading…</ChartState>
      ) : error ? (
        <ChartState>Couldn&apos;t load chart data.</ChartState>
      ) : data.length === 0 ? (
        <ChartState>No burndown data for this project.</ChartState>
      ) : (

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
          />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            interval={1}
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
              value !== null ? `${value} tasks` : 'N/A',
              name === 'ideal' ? 'Ideal' : 'Actual',
            ]}
          />
          <Legend
            formatter={(value) => (
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {value === 'ideal' ? 'Ideal' : 'Actual'}
              </span>
            )}
          />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="#c4b5fd"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#7c3aed"
            strokeWidth={2.5}
            dot={{ fill: '#7c3aed', r: 4 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
      )}
    </div>
  )
}