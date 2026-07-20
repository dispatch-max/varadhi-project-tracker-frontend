'use client'

import { useState } from 'react'
import { X, Loader2, FolderPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { foldersApi } from '@/lib/api/folders.api'

export function CreateFolderModal({ onClose, onSuccess }) {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Folder name is required.')
      return
    }
    setIsLoading(true)
    setError('')
    try {
      await foldersApi.create(name.trim())
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(
        err?.response?.data?.message ||
        'Failed to create folder. Try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !isLoading && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">
            New Folder
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="folderName">Folder Name *</Label>
            <Input
              id="folderName"
              placeholder="e.g. Design Assets"
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-violet-600 hover:bg-violet-700"
              disabled={isLoading}
            >
              {isLoading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                : <><FolderPlus className="w-4 h-4 mr-2" />Create Folder</>}
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}