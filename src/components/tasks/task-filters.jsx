'use client'

import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  Plus,
  Download,
} from 'lucide-react'

export function TaskFilters() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">

      <div className="flex flex-wrap items-center justify-between gap-4">

        {/* Left Side */}
        <div className="flex flex-wrap items-center gap-3">

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              placeholder="Search tasks..."
              className="h-10 w-64 rounded-xl border border-border bg-background pl-10 pr-4 text-sm outline-none transition focus:border-violet-500"
            />
          </div>

          {/* Project */}
          <select className="h-10 rounded-xl border border-border bg-card px-4 text-sm">
            <option>Project</option>
          </select>

          {/* Status */}
          <select className="h-10 rounded-xl border border-border bg-card px-4 text-sm">
            <option>Status</option>
          </select>

          {/* Priority */}
          <select className="h-10 rounded-xl border border-border bg-card px-4 text-sm">
            <option>Priority</option>
          </select>

          {/* Assignee */}
          <select className="h-10 rounded-xl border border-border bg-card px-4 text-sm">
            <option>Assignee</option>
          </select>

        </div>

        {/* Right Side */}
        <div className="flex flex-wrap items-center gap-3">

          <button className="flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm hover:bg-background">
            <SlidersHorizontal className="h-4 w-4" />
            Filter
          </button>

          <button className="flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm hover:bg-background">
            <Grid3X3 className="h-4 w-4" />
            Group By
          </button>

          <button className="flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-700">
            <Plus className="h-4 w-4" />
            New Task
          </button>

          <button className="flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm hover:bg-background">
            <Download className="h-4 w-4" />
            Export
          </button>

        </div>

      </div>

    </div>
  )
}