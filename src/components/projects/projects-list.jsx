'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter } from 'lucide-react'
import { ProjectCard } from './project-card'
import { CreateProjectModal } from './create-project-modal'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/auth.store'
import { projectsApi } from '@/lib/api/projects.api'
import { useHasMounted } from '@/hooks/use-has-mounted'

// Skeleton loader
function ProjectSkeleton() {
  return (
    <div className="bg-card rounded-xl border border-border p-5 animate-pulse">
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
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const mounted = useHasMounted()

  async function fetchProjects() {
    setIsLoading(true)
    setError(null)
    try {
      const filters = {}
      if (statusFilter !== 'all') filters.status = statusFilter
      if (search) filters.search = search
      const response = await projectsApi.getAll(filters)
      setProjects(response.data || [])
    } catch (err) {
      setError('Failed to load projects.')
      setProjects([])
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch on mount and when filters change
  useEffect(() => {
    const timer = setTimeout(fetchProjects, 300)
    return () => clearTimeout(timer)
  }, [search, statusFilter])

  // Role check depends on the auth store (client-only). Gate it on `mounted`
  // so the server and first client render agree on whether the button exists.
  const canCreate = mounted && ['admin', 'manager'].includes(user?.role)

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
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-card placeholder:text-slate-400"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-card text-foreground"
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

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
          {error} —{' '}
          <button onClick={fetchProjects} className="underline font-medium">
            Retry
          </button>
        </div>
      )}

      {/* Results count */}
      {!isLoading && (
        <p className="text-xs text-slate-400 mb-4">
          Showing {projects.length} project{projects.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <ProjectSkeleton key={i} />)}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onUpdated={fetchProjects}
            />
            // <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Filter className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">No projects found</p>
          <p className="text-xs text-slate-400 mt-1">
            Try changing your search or filter
          </p>
        </div>
      )}

      {/* Create Modal */}
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
