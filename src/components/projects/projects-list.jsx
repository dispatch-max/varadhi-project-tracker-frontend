'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
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
  MoreVertical,
  ChevronLeft,
  ChevronRight
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
    <div className="animate-pulse space-y-2 p-2.5 bg-white rounded-lg border border-slate-200/80">
      <div className="h-3.5 w-28 rounded bg-slate-200"></div>
      <div className="h-2.5 rounded bg-slate-100"></div>
      <div className="h-2.5 w-3/4 rounded bg-slate-100"></div>
    </div>
  )
}

export function ProjectsList() {
  const { user } = useAuthStore()
  const mounted = useHasMounted()
  const dateInputRef = useRef(null)

  const canCreate =
    mounted && ['admin', 'manager'].includes(user?.role)

  const [allProjects, setAllProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showExport, setShowExport] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [showTeam, setShowTeam] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDeadlineDate, setSelectedDeadlineDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [view, setView] = useState('table')
  const [showCreateModal, setShowCreateModal] = useState(false)

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

  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, search])

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

  const itemsPerPage = 10
  const startIndex = (currentPage - 1) * itemsPerPage
  const totalPages = Math.ceil(displayedProjects.length / itemsPerPage)
  
  const paginatedProjects = useMemo(() => {
    return displayedProjects.slice(startIndex, startIndex + itemsPerPage)
  }, [displayedProjects, startIndex, itemsPerPage])

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
    <div className="w-full space-y-2 text-slate-800 pt-0 mt-0">
      
      {/* TOP KPI STAT CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2.5">
        {[
          { title: 'Total Projects', value: statistics.total, subText: '+3 this month', icon: FolderKanban, color: 'bg-violet-50 text-violet-600' },
          { title: 'Active Projects', value: statistics.active, subText: '75% of total', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
          { title: 'Completed', value: statistics.completed, subText: '+2 this month', icon: CheckCircle2, color: 'bg-blue-50 text-blue-600' },
          { title: 'On Hold', value: statistics.hold, subText: '4% of total', icon: PauseCircle, color: 'bg-amber-50 text-amber-600' },
          { title: 'Overdue', value: statistics.overdue, subText: 'Needs attention', icon: AlertTriangle, color: 'bg-red-50 text-red-500' }
        ].map((item) => {
          const Icon = item.icon
          return (
            <div 
              key={item.title} 
              className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-xs flex items-center justify-between"
            >
              <div>
                <p className="text-[11px] font-semibold text-slate-500 leading-none">{item.title}</p>
                <p className="text-lg font-bold text-slate-900 mt-1 leading-none">{item.value}</p>
                <p className="text-[10px] font-medium text-slate-400 mt-1 leading-none">{item.subText}</p>
              </div>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
          )
        })}
      </div>

      {/* MIDDLE ANALYTICS SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Project Health Overview */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Project Health Overview</h3>
          <div className="flex items-center gap-3">
            <div className="relative w-16 h-16 flex items-center justify-center rounded-full border-[6px] border-emerald-500 border-t-amber-500 border-r-red-400 shrink-0">
              <div className="text-center">
                <p className="text-base font-bold text-slate-900 leading-none">{statistics.total}</p>
                <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Total</p>
              </div>
            </div>
            <div className="space-y-1 text-[11px] text-slate-600 flex-1">
              <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Completed</span><span className="font-semibold text-slate-800">{statistics.completed}</span></div>
              <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span>Active</span><span className="font-semibold text-slate-800">{statistics.active}</span></div>
              <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400"></span>Overdue</span><span className="font-semibold text-slate-800">{statistics.overdue}</span></div>
              <div className="flex justify-between items-center"><span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-300"></span>On Hold</span><span className="font-semibold text-slate-800">{statistics.hold}</span></div>
            </div>
          </div>
        </div>

        {/* Dynamic Status Distribution */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs space-y-2">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Status Distribution</h3>
          <div className="space-y-1.5 text-[11px]">
            {[
              { label: 'Active', value: statistics.active, color: 'bg-emerald-500' },
              { label: 'Completed', value: statistics.completed, color: 'bg-blue-500' },
              { label: 'On Hold', value: statistics.hold, color: 'bg-amber-500' },
              { label: 'Overdue', value: statistics.overdue, color: 'bg-red-500' }
            ].map((item) => {
              const percent = statistics.total === 0 ? 0 : Math.round((item.value / statistics.total) * 100)
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-slate-600 mb-0.5 font-medium">
                    <span>{item.label}</span>
                    <span className="font-semibold text-slate-800">{item.value} ({percent}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full transition-all duration-300`} style={{ width: `${percent}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Working Calendar & Upcoming Deadlines Widget */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Upcoming Deadlines</h3>
              {selectedDeadlineDate && (
                <button 
                  onClick={() => setSelectedDeadlineDate('')} 
                  className="text-[10px] text-violet-600 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
            
            <div className="relative">
              <button 
                type="button" 
                onClick={() => dateInputRef.current?.showPicker()}
                className="p-1 hover:bg-slate-100 rounded-md transition"
                title="Filter by Date"
              >
                <CalendarDays className="w-4 h-4 text-violet-600" />
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
            <div className="space-y-1.5 text-[11px]">
              {upcomingProjects.map(project => (
                <div key={project.id} className="flex items-center justify-between border-b border-slate-100 pb-1 last:border-0 last:pb-0">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 truncate">{project.name}</p>
                    <p className="text-[10px] text-slate-400">{project.manager?.name || 'Unassigned'}</p>
                  </div>
                  <span className="shrink-0 px-2 py-0.5 text-[10px] font-semibold bg-violet-50 text-violet-700 rounded-md border border-violet-100">
                    {new Date(project.endDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-[11px] text-slate-400">
              {selectedDeadlineDate ? "No projects due on this date" : "No upcoming deadlines"}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-xl p-2.5 shadow-xs">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
              <button
                type="button"
                onClick={() => setView("table")}
                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition ${
                  view === "table" ? "bg-white shadow-xs text-violet-600" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Table View"
              >
                <Table2 className="w-3.5 h-3.5" /> Table
              </button>
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition ${
                  view === "grid" ? "bg-white shadow-xs text-violet-600" : "text-slate-500 hover:text-slate-800"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Grid
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Button */}
            <button 
              onClick={() => setShowExport(true)} 
              className="h-8 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5 transition shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Export
            </button>

            {/* New Project CTA */}
            {canCreate && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition shrink-0 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                New Project
              </button>
            )}
          </div>
        </div>
      </div>

     {/* MAIN DATA SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 items-start">
        
        {/* MAIN PROJECTS TABLE/GRID */}
        <div className="xl:col-span-2 min-w-0 bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs space-y-3">
          {/* TAB FILTERS */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
            <div className="flex space-x-4 overflow-x-auto">
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
                  className={`pb-1 font-semibold whitespace-nowrap transition-colors border-b-2 ${
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

          {/* LOADING STATE */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProjectSkeleton key={i} />
              ))}
            </div>
          )}

          {/* DATA VIEW */}
          {!isLoading && displayedProjects.length > 0 && (
            <>
              {view === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {paginatedProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} onUpdated={fetchProjects} />
                  ))}
                </div>
              ) : (
                <div className="w-full overflow-hidden rounded-lg border border-slate-200/80">
                  <div className="w-full overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse min-w-[550px]">
                      <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                        <tr>
                          <th className="p-2 w-10 text-center">#</th>
                          <th className="p-2">Project Name</th>
                          <th className="p-2">Manager</th>
                          <th className="p-2">Team</th>
                          <th className="p-2">Deadline</th>
                          <th className="p-2">Status</th>
                          <th className="p-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {paginatedProjects.map((project, index) => {
                          const statusStyles = {
                            active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            in_progress: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                            completed: 'bg-blue-50 text-blue-700 border-blue-200',
                            on_hold: 'bg-amber-50 text-amber-700 border-amber-200',
                            overdue: 'bg-red-50 text-red-700 border-red-200',
                          }[project.status] || 'bg-slate-50 text-slate-700 border-slate-200'

                          return (
                            <tr 
                              key={project.id} 
                              className="hover:bg-slate-50/80 cursor-pointer transition"
                            >
                              <td className="p-2 text-center text-slate-400 font-medium text-[11px]">
                                {startIndex + index + 1}
                              </td>
                              <td className="p-2">
                                <Link 
                                  href={`/projects/${project.id}`}
                                  className="block group"
                                >
                                  <p className="font-semibold text-slate-900 group-hover:text-violet-600 transition-colors text-xs">
                                    {project.name}
                                  </p>
                                  <p className="text-[11px] text-slate-400 line-clamp-1 max-w-[180px]">
                                    {project.description || "No description provided"}
                                  </p>
                                </Link>
                              </td>
                              <td className="p-2 text-slate-700 font-medium whitespace-nowrap">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                                    {project.manager?.name?.[0] || 'U'}
                                  </div>
                                  <span className="text-[11px]">{project.manager?.name || "Unassigned"}</span>
                                </div>
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                                  <Users className="w-3 h-3 text-slate-400" />
                                  {project.members?.length || 0}
                                </span>
                              </td>
                              <td className="p-2 text-slate-500 whitespace-nowrap text-[11px]">
                                {project.endDate ? (
                                  <span className="flex items-center gap-1">
                                    <CalendarDays className="w-3 h-3 text-slate-400" />
                                    {new Date(project.endDate).toLocaleDateString()}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">No deadline</span>
                                )}
                              </td>
                              <td className="p-2 whitespace-nowrap">
                                <span className={`inline-block px-1.5 py-0.5 text-[10px] font-semibold border rounded capitalize ${statusStyles}`}>
                                  {project.status ? project.status.replace("_", " ") : "Draft"}
                                </span>
                              </td>
                              <td className="p-2 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  <Link 
                                    href={`/projects/${project.id}`}
                                    className="px-1.5 py-0.5 text-[11px] font-semibold text-violet-600 hover:bg-violet-50 rounded transition inline-block"
                                  >
                                    View
                                  </Link>
                                  <button 
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-slate-400 hover:text-slate-700 p-0.5 rounded hover:bg-slate-100 transition"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* PAGINATION FOOTER */}
                  <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50/60">
                    <p className="text-[11px] text-slate-500">
                      Showing{' '}
                      <span className="font-semibold text-slate-700">
                        {displayedProjects.length > 0 ? startIndex + 1 : 0}
                      </span>{' '}
                      to{' '}
                      <span className="font-semibold text-slate-700">
                        {Math.min(startIndex + itemsPerPage, displayedProjects.length)}
                      </span>{' '}
                      of <span className="font-semibold text-slate-700">{displayedProjects.length}</span> projects
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </button>
                      <span className="text-[11px] font-semibold text-slate-600 px-1.5">
                        {currentPage} / {totalPages || 1}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-1 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      >
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* EMPTY STATE */}
          {!isLoading && displayedProjects.length === 0 && (
            <div className="py-8 text-center flex flex-col items-center">
              <FolderKanban className="w-8 h-8 text-slate-300 mb-1.5" />
              <p className="text-sm font-semibold text-slate-800">No Projects Found</p>
              <p className="text-xs text-slate-400 max-w-xs mt-0.5">There are no projects matching your search or status filter.</p>
              {canCreate && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 h-8 px-3 rounded-lg bg-violet-600 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  Create Project
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT WIDGET PANEL */}
        <div className="space-y-3 min-w-0">
          {/* AI Insights Card */}
          <div className="bg-gradient-to-br from-violet-600 to-indigo-700 text-white p-3 rounded-xl shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider">AI Insights</h3>
            </div>
            <div className="space-y-1.5 text-[11px] text-violet-100">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" />
                <span><strong>{statistics.completed}</strong> project(s) completed.</span>
              </div>
              <div className="flex items-start gap-2">
                <Clock3 className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                <span><strong>{statistics.active}</strong> project(s) active in progress.</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-red-300 shrink-0 mt-0.5" />
                <span><strong>{statistics.overdue}</strong> project(s) overdue.</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-3 shadow-xs space-y-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {canCreate && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition text-left space-y-1"
                >
                  <Plus className="w-4 h-4 text-violet-600" />
                  <p className="text-xs font-bold text-slate-800">New Project</p>
                </button>
              )}
              <button
                onClick={() => setShowExport(true)}
                className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition text-left space-y-1"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-bold text-slate-800">Export Report</p>
              </button>
              <button
                onClick={() => setShowAnalytics(true)}
                className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition text-left space-y-1"
              >
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <p className="text-xs font-bold text-slate-800">Analytics</p>
              </button>
              <button
                onClick={() => setShowTeam(true)}
                className="p-2 border border-slate-100 rounded-lg hover:bg-slate-50 transition text-left space-y-1"
              >
                <Users className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-bold text-slate-800">Team Members</p>
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