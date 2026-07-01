'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  MoreHorizontal, Pencil,
  Archive, Trash2, Eye
} from 'lucide-react'
import { projectsApi } from '@/lib/api/projects.api'
import { useAuthStore } from '@/store/auth.store'
import { cn } from '@/utils'

export function ProjectCardMenu({ project, onUpdated }) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isAdmin   = user?.role === 'admin'
  const isManager = user?.role === 'manager'
  const canEdit   = isAdmin || isManager
  const canDelete = isAdmin

  async function handleArchive() {
    if (!confirm(`Archive "${project.name}"?`)) return
    setIsLoading(true)
    setOpen(false)
    try {
      await projectsApi.archive(project.id)
      onUpdated?.()
    } catch (err) {
      alert('Failed to archive project.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Permanently delete "${project.name}"? This cannot be undone.`)) return
    setIsLoading(true)
    setOpen(false)
    try {
      await projectsApi.delete(project.id)
      onUpdated?.()
    } catch (err) {
      alert('Failed to delete project.')
    } finally {
      setIsLoading(false)
    }
  }

  // Nothing to show if no permissions
  if (!canEdit && !canDelete) return null

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.preventDefault(); setOpen(!open) }}
        disabled={isLoading}
        className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 disabled:opacity-50"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-7 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1">

            {/* View */}
            <button
              onClick={(e) => {
                e.preventDefault()
                setOpen(false)
                router.push(`/projects/${project.id}`)
              }}
              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
            >
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              View Details
            </button>

            {/* Edit */}
            {canEdit && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  setOpen(false)
                  router.push(`/projects/${project.id}?edit=true`)
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Pencil className="w-3.5 h-3.5 text-slate-400" />
                Edit Project
              </button>
            )}

            {/* Archive */}
            {canEdit && project.status !== 'archived' && (
              <button
                onClick={(e) => { e.preventDefault(); handleArchive() }}
                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Archive className="w-3.5 h-3.5 text-slate-400" />
                Archive
              </button>
            )}

            {/* Delete */}
            {canDelete && (
              <>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={(e) => { e.preventDefault(); handleDelete() }}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}