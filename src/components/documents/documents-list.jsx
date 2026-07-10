


'use client'

import { useState, useEffect } from 'react'
import {
  Upload, Search, Download,
  Trash2, Eye, Filter, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { FileIcon } from './file-icon'
import { UploadModal } from './upload-modal'
import { formatDate, formatFileSize, getInitials, getAvatarColor, cn } from '@/utils'
import { useAuthStore } from '@/store/auth.store'
import { documentsApi } from '@/lib/api/documents.api'

export function DocumentsList() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [documents, setDocuments] = useState([])

  // Delete confirmation dialog state
  const [deleteTarget, setDeleteTarget] = useState(null) // the doc pending deletion
  const [isDeleting, setIsDeleting] = useState(false)

  async function loadDocuments() {
    try {
      const docs = await documentsApi.getAll()
      setDocuments(Array.isArray(docs) ? docs : [])
    } catch (err) {
      console.error('DOCUMENT LOAD ERROR =>', err)
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  // Filter documents (uploadedBy guarded — API may return docs without the join)
  const filtered = documents.filter((doc) => {
    const name = doc.name ?? ''
    const description = doc.description ?? ''
    const uploaderName = doc.uploadedBy?.name ?? ''
    const matchesSearch =
      name.toLowerCase().includes(search.toLowerCase()) ||
      description.toLowerCase().includes(search.toLowerCase()) ||
      uploaderName.toLowerCase().includes(search.toLowerCase())
    const matchesType =
      typeFilter === 'all' || doc.fileType === typeFilter
    return matchesSearch && matchesType
  })

  // Existing delete API logic — unchanged, just no confirm() here anymore
  // (the AlertDialog is the confirmation step now)
  async function handleDelete(id) {
    setIsDeleting(true)
    try {
      await documentsApi.delete(id)   // actually delete from PostgreSQL
      await loadDocuments()           // refetch so UI matches the DB
      setDeleteTarget(null)           // close the dialog
    } catch (err) {
      alert('Failed to delete the document. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleDownload(doc) {
    try {
      const response = await documentsApi.download(doc.id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = doc.originalName || doc.name || 'document'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to download the file. Please try again.')
    }
  }

  return (
    <div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white placeholder:text-slate-400"
          />
        </div>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white text-slate-700"
        >
          <option value="all">All Types</option>
          <option value="pdf">PDF</option>
          <option value="docx">DOCX</option>
          <option value="xlsx">XLSX</option>
          <option value="png">PNG</option>
          <option value="jpg">JPG</option>
          <option value="zip">ZIP</option>
        </select>

        {/* Upload Button */}
        <Button
          onClick={() => setShowUploadModal(true)}
          className="bg-violet-600 hover:bg-violet-700 flex-shrink-0"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload File
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {
        // [
        //   { label: 'Total Files', value: documents.length },
        //   { label: 'PDFs', value: documents.filter((d) => d.fileType === 'pdf').length },
        //   { label: 'Images', value: documents.filter((d) => ['png','jpg','jpeg'].includes(d.fileType)).length },
        //   { label: 'Spreadsheets', value: documents.filter((d) => ['xls','xlsx'].includes(d.fileType)).length },
        // ]
        [
  { label: 'Total Files', value: documents.length },

  { label: 'PDFs',
    value: documents.filter((d) => d.fileType === 'pdf').length
  },

  { label: 'Documents',
    value: documents.filter((d) =>
      ['doc', 'docx'].includes(d.fileType)
    ).length
  },

  { label: 'Spreadsheets',
    value: documents.filter((d) =>
      ['xls', 'xlsx'].includes(d.fileType)
    ).length
  },

  { label: 'Images',
    value: documents.filter((d) =>
      ['png', 'jpg', 'jpeg'].includes(d.fileType)
    ).length
  },

  { label: 'Archives',
    value: documents.filter((d) => d.fileType === 'zip').length
  },
]
        .map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-slate-200 px-4 py-3"
          >
            <p className="text-xl font-semibold text-slate-800">
              {stat.value}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Results */}
      <p className="text-xs text-slate-400 mb-3">
        Showing {filtered.length} file{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Documents Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition-shadow"
            >
              {/* Top row */}
              <div className="flex items-start gap-3 mb-3">
                <FileIcon fileType={doc.fileType} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {doc.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatFileSize(doc.fileSize)}
                  </p>
                </div>
              </div>

              {/* Description */}
              {doc.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                  {doc.description}
                </p>
              )}

              {/* Project tag */}
              {doc.project && (
                <div className="mb-3">
                  <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-md font-medium">
                    {doc.project.name}
                  </span>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                {/* Uploader */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-semibold',
                    getAvatarColor(doc.uploadedBy?.name)
                  )}>
                    {getInitials(doc.uploadedBy?.name)}
                  </div>
                  <span className="text-xs text-slate-500">
                    {doc.uploadedBy?.name ?? 'Unknown'}
                  </span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-400">
                    {formatDate(doc.createdAt, 'MMM dd')}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                      {user?.role?.toLowerCase() !== 'employee' && (
                        <>
                          <button
                            title="Download"
                            onClick={() => handleDownload(doc)}
                            className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          <button
                            title="Delete"
                            onClick={() => setDeleteTarget(doc)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                {/* <div className="flex items-center gap-1">
                  <button
                    title="Download"
                    onClick={() => handleDownload(doc)}
                    className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    title="Delete"
                    onClick={() => setDeleteTarget(doc)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div> */}

              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Filter className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">
            No documents found
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Upload a file or try a different search
          </p>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold text-slate-800">
              Delete Document?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              Are you sure you want to delete this document? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeleting}
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                // keep the dialog open until the API call finishes
                e.preventDefault()
                if (deleteTarget) handleDelete(deleteTarget.id)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            loadDocuments()
          }}
        />
      )}

    </div>
  )
}