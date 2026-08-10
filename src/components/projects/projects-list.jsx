'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Plus,
  Download,
  Sparkles,
  FolderKanban,
  CheckCircle2,
  Clock3,
  PauseCircle,
  AlertTriangle,
  CalendarDays,
  LayoutGrid,
  Table2,
  TrendingUp,
  Users,
  MoreVertical
} from 'lucide-react'
import {
  ExportModal,
  AnalyticsModal,
  TeamMembersModal,
} from "./project-modals";
import { ProjectCard } from './project-card'
import { CreateProjectModal } from './create-project-modal'

import { useAuthStore } from '@/store/auth.store'
import { projectsApi } from '@/lib/api/projects.api'
import { useHasMounted } from '@/hooks/use-has-mounted'

function ProjectSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-3/4 mb-3" />
      <div className="h-3 bg-slate-100 rounded w-full mb-2" />
      <div className="h-3 bg-slate-100 rounded w-2/3 mb-4" />
      <div className="h-1.5 bg-slate-100 rounded-full mb-4" />
      <div className="flex gap-2">
        <div className="w-6 h-6 rounded-full bg-slate-100" />
        <div className="w-6 h-6 rounded-full bg-slate-100" />
      </div>
    </div>
  )
}

export function ProjectsList() {
  const { user } = useAuthStore()
  const mounted = useHasMounted()
  const dateInputRef = useRef(null)
  const searchParams = useSearchParams()

  const canCreate =
    mounted && ['admin', 'manager'].includes(user?.role)

  const [allProjects, setAllProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showExport, setShowExport] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showTeam, setShowTeam] = useState(false)
  // Seeded from the URL so the topbar search hand-off (?search=…) still lands
  // here after the V2.0 list rewrite.
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDeadlineDate, setSelectedDeadlineDate] = useState('')

  const [view, setView] = useState('table')
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Picks up a search term the topbar navigated here with (?search=...),
  // including when this page is already mounted and the term changes.
  useEffect(() => {
    // Same traced-false-positive as elsewhere in this app (e.g.
    // use-has-mounted.js's setMounted(true)) — a plain setState with no
    // async work, safe to run directly in the effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(searchParams.get('search') || '')
  }, [searchParams])

  async function fetchProjects() {
    try {
      setIsLoading(true)
      setError(null)

      const filters = {}
      if (search.trim()) filters.search = search

      const response = await projectsApi.getAll(filters)
      setAllProjects(response.data || [])
    } catch (err) {
      setAllProjects([])
      setError('Failed to load projects.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects()
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  // Calculate statistics dynamically from all returned projects
  const statistics = useMemo(() => {
    const total = allProjects.length
    const active = allProjects.filter(p => p.status === 'active' || p.status === 'in_progress').length
    const completed = allProjects.filter(p => p.status === 'completed').length
    const hold = allProjects.filter(p => p.status === 'on_hold').length
    
    const overdue = allProjects.filter(project => {
      if (!project.endDate || project.status === 'completed') return false
      const endDate = new Date(project.endDate)
      return !isNaN(endDate.getTime()) && endDate < new Date()
    }).length

    return { total, active, completed, hold, overdue }
  }, [allProjects])

  // Filter projects dynamically based on the selected tab (including computed Overdue status)
  const displayedProjects = useMemo(() => {
    const now = new Date()

    return allProjects.filter((project) => {
      if (statusFilter === 'all') return true

      if (statusFilter === 'overdue') {
        if (!project.endDate || project.status === 'completed') return false
        const endDate = new Date(project.endDate)
        return !isNaN(endDate.getTime()) && endDate < now
      }

      if (statusFilter === 'active') {
        return project.status === 'active' || project.status === 'in_progress'
      }

      return project.status === statusFilter
    })
  }, [allProjects, statusFilter])

  const upcomingProjects = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    return [...allProjects]
      .filter(p => {
        if (!p.endDate) return false
        const projectDate = new Date(p.endDate)
        if (isNaN(projectDate.getTime())) return false

        if (selectedDeadlineDate) {
          const filterDate = new Date(selectedDeadlineDate)
          return (
            projectDate.getFullYear() === filterDate.getFullYear() &&
            projectDate.getMonth() === filterDate.getMonth() &&
            projectDate.getDate() === filterDate.getDate()
          )
        }

        return projectDate >= now
      })
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
      .slice(0, 5)
  }, [allProjects, selectedDeadlineDate])

  return (
    <div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white placeholder:text-slate-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-700"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
        {canCreate && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-violet-600 hover:bg-violet-700 flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      {/* MIDDLE ANALYTICS SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Project Health Overview */}
        <div className="project-panel p-5 space-y-4">
          <h3 className="project-panel-title">Project Health Overview</h3>
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-[10px] border-emerald-500 border-t-amber-500 border-r-red-400 shrink-0">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900 leading-none">{statistics.total}</p>
                <p className="text-xs text-slate-400 font-semibold uppercase mt-1">Total</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-600 flex-1">
              <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Completed</span><span className="font-semibold text-slate-800">{statistics.completed}</span></div>
              <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>Active</span><span className="font-semibold text-slate-800">{statistics.active}</span></div>
              <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>Overdue</span><span className="font-semibold text-slate-800">{statistics.overdue}</span></div>
              <div className="flex justify-between items-center"><span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>On Hold</span><span className="font-semibold text-slate-800">{statistics.hold}</span></div>
            </div>
          </div>
        </div>

        {/* Dynamic Status Distribution */}
        <div className="project-panel p-5 space-y-3">
          <h3 className="project-panel-title">Status Distribution</h3>
          <div className="space-y-3 text-xs">
            {[
              { label: 'Active', value: statistics.active, color: 'bg-emerald-500' },
              { label: 'Completed', value: statistics.completed, color: 'bg-blue-500' },
              { label: 'On Hold', value: statistics.hold, color: 'bg-amber-500' },
              { label: 'Overdue', value: statistics.overdue, color: 'bg-red-500' }
            ].map((item) => {
              const percent = statistics.total === 0 ? 0 : Math.round((item.value / statistics.total) * 100)
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-slate-600 mb-1 font-medium text-xs">
                    <span>{item.label}</span>
                    <span className="font-semibold text-slate-800">{item.value} ({percent}%)</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-300`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Working Calendar & Upcoming Deadlines Widget */}
        <div className="project-panel p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="project-panel-title">Upcoming Deadlines</h3>
              {selectedDeadlineDate && (
                <button 
                  onClick={() => setSelectedDeadlineDate('')} 
                  className="text-xs text-violet-600 hover:underline mt-0.5"
                >
                  Clear filter
                </button>
              )}
            </div>
            
            <div className="relative">
              <button 
                type="button" 
                onClick={() => dateInputRef.current?.showPicker()}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition"
                title="Filter by Date"
              >
                <CalendarDays className="w-5 h-5 text-violet-600" />
              </button>
              <input 
                ref={dateInputRef}
                type="date" 
                value={selectedDeadlineDate}
                onChange={(e) => setSelectedDeadlineDate(e.target.value)}
                className="sr-only"
              />
            </div>
          </div>

          {upcomingProjects.length > 0 ? (
            <div className="space-y-3 text-xs">
              {upcomingProjects.map(project => (
                <div key={project.id} className="flex items-center justify-between border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 text-xs sm:text-sm truncate">{project.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{project.manager?.name || 'Unassigned'}</p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 text-xs font-semibold bg-violet-50 text-violet-700 rounded-lg border border-violet-100">
                    {new Date(project.endDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              {selectedDeadlineDate ? "No projects due on this date" : "No upcoming deadlines"}
            </div>
          )}
        </div>
      </div>

      {/* MAIN DATA SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        
        {/* MAIN PROJECTS TABLE/GRID */}
        <div className="xl:col-span-2 project-panel p-5 space-y-4">
          
          {/* TAB FILTERS */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm">
            <div className="flex space-x-6 overflow-x-auto">
              {[
                { id: 'all', label: `All (${statistics.total})` },
                { id: 'active', label: `Active (${statistics.active})` },
                { id: 'on_hold', label: `On Hold (${statistics.hold})` },
                { id: 'completed', label: `Completed (${statistics.completed})` },
                { id: 'overdue', label: `Overdue (${statistics.overdue})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`pb-2 font-semibold text-sm whitespace-nowrap transition-colors border-b-2 ${
                    statusFilter === tab.id
                      ? 'border-violet-600 text-violet-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600">No projects found</p>
          <p className="text-xs text-slate-400 mt-1">
            Try changing your search or filter
          </p>
        </div>

        {/* RIGHT WIDGET PANEL */}
        <div className="space-y-5">
          {/* Project summary — real counts derived from `statistics`, not AI.
              Renamed from "AI Project Insights" when the AI surface was
              removed; the data and behaviour are unchanged. */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white p-5 rounded-2xl shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-white/20 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-base font-bold">Project Summary</h3>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-violet-100">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                <span><strong>{statistics.completed}</strong> project(s) completed successfully.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <Clock3 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <span><strong>{statistics.active}</strong> project(s) actively in progress.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
                <span><strong>{statistics.overdue}</strong> project(s) require immediate attention.</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="project-panel p-5 space-y-4">
            <h3 className="project-panel-title">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {canCreate && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition text-left space-y-1.5"
                >
                  <Plus className="w-5 h-5 text-violet-600" />
                  <p className="text-xs sm:text-sm font-bold text-slate-800">New Project</p>
                </button>
              )}
              <button
                onClick={() => setShowExport(true)}
                className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition text-left space-y-1.5"
              >
                <Download className="w-5 h-5 text-blue-600" />
                <p className="text-xs sm:text-sm font-bold text-slate-800">Export Report</p>
              </button>
              <button
                onClick={() => setShowAnalytics(true)}
                className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition text-left space-y-1.5"
              >
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <p className="text-xs sm:text-sm font-bold text-slate-800">Analytics</p>
              </button>
              <button
                onClick={() => setShowTeam(true)}
                className="p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition text-left space-y-1.5"
              >
                <Users className="w-5 h-5 text-amber-600" />
                <p className="text-xs sm:text-sm font-bold text-slate-800">Team Members</p>
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* MODALS */}
      <ExportModal open={showExport} onClose={() => setShowExport(false)} projects={allProjects} />
      <AnalyticsModal open={showAnalytics} onClose={() => setShowAnalytics(false)} projects={allProjects} />
      <TeamMembersModal open={showTeam} onClose={() => setShowTeam(false)} members={[]} />

      {showCreateModal && (
        <CreateProjectModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false)
            fetchProjects()
          }}
        />
      )}
    </div>
  )
}