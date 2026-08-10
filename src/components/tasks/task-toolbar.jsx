'use client'

import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TaskToolbar() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">

      {/* Search */}
      <div className="relative flex-1 min-w-[320px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-3 py-2 text-sm border border-border rounded-lg"
      >
        <option value="all">All Status</option>
        <option value="todo">To Do</option>
        <option value="progress">In Progress</option>
        <option value="completed">Completed</option>
      </select>

      <select
        value={priorityFilter}
        onChange={(e) => setPriorityFilter(e.target.value)}
        className="px-3 py-2 text-sm border border-border rounded-lg"
      >
        <option value="all">All Priority</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>

      <Button>
        <Plus className="w-4 h-4 mr-2" />
        New Task
      </Button>

    </div>
  )
}