'use client'

import { useState, useEffect } from 'react'
import {
  Upload, Search, Download, Trash2, Filter, Loader2,
  Folder, FolderPlus, FolderInput, Files, Pencil, X as XIcon,
  ChevronRight, HardDrive, Clock, Share2, Archive, FileText,
  Eye, MoreVertical, LayoutGrid, List, CheckSquare, ChevronDown,
  ChevronLeft
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
import { CreateFolderModal } from './create-folder-modal'
import { formatDate, formatFileSize, getInitials, getAvatarColor, cn } from '@/utils'
import { useAuthStore } from '@/store/auth.store'
import { documentsApi } from '@/lib/api/documents.api'
import { foldersApi } from '@/lib/api/folders.api'

export function DocumentsList() {
  const { user } = useAuthStore()
  const isEmployee = user?.role?.toLowerCase() === 'employee'
  const canManage = !isEmployee

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [documents, setDocuments] = useState([])

  // ─── Folder State ────────────────────────────────────────────────────────
  const [folders, setFolders] = useState([])
  const [selectedFolder, setSelectedFolder] = useState('all')
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [folderDeleteTarget, setFolderDeleteTarget] = useState(null)
  const [isFolderDeleting, setIsFolderDeleting] = useState(false)
  const [renamingFolder, setRenamingFolder] = useState(null)
  const [renameValue, setRenameValue] = useState('')

  // ─── Pagination State ───────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // ─── UI / Drawer State ───────────────────────────────────────────────────
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [viewMode, setViewMode] = useState('table') // 'table' | 'grid'
  const [moveTargetDoc, setMoveTargetDoc] = useState(null)

  // Delete document dialog state
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  async function loadFolders() {
    try {
      const list = await foldersApi.getAll()
      setFolders(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('FOLDER LOAD ERROR =>', err)
      setFolders([])
    }
  }

  async function loadDocuments(folder = selectedFolder) {
    try {
      const filters = {}
      if (folder && folder !== 'all') filters.folderId = folder
      const docs = await documentsApi.getAll(filters)
      setDocuments(Array.isArray(docs) ? docs : [])
    } catch (err) {
      console.error('DOCUMENT LOAD ERROR =>', err)
    }
  }

  useEffect(() => {
    loadFolders()
  }, [])

  useEffect(() => {
    loadDocuments(selectedFolder)
    setCurrentPage(1)
  }, [selectedFolder])

  function refreshAll() {
    loadFolders()
    loadDocuments()
  }

  // Reset pagination when searching or filtering
  useEffect(() => {
    setCurrentPage(1)
  }, [search, typeFilter])

  // ─── Handlers ────────────────────────────────────────────────────────────
  async function handleFolderDelete(id) {
    setIsFolderDeleting(true)
    try {
      await foldersApi.delete(id)
      if (selectedFolder === id) setSelectedFolder('all')
      setFolderDeleteTarget(null)
      refreshAll()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to delete the folder.')
    } finally {
      setIsFolderDeleting(false)
    }
  }

  async function handleFolderRename(e) {
    e.preventDefault()
    if (!renameValue.trim() || !renamingFolder) return
    try {
      await foldersApi.rename(renamingFolder.id, renameValue.trim())
      setRenamingFolder(null)
      setRenameValue('')
      loadFolders()
      loadDocuments()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to rename the folder.')
    }
  }

  async function handleMove(doc, folderId) {
    try {
      await documentsApi.move(doc.id, folderId)
      setMoveTargetDoc(null)
      refreshAll()
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to move the document.')
    }
  }

  async function handleDelete(id) {
    setIsDeleting(true)
    try {
      await documentsApi.delete(id)
      setDeleteTarget(null)
      if (selectedDoc?.id === id) setSelectedDoc(null)
      refreshAll()
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

  // Filter calculations
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

  // Pagination Math
  const totalPages = Math.ceil(filtered.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDocs = filtered.slice(startIndex, startIndex + itemsPerPage)

  // Quick Stats
  const totalFiles = documents.length
  const pdfCount = documents.filter((d) => d.fileType === 'pdf').length
  const docCount = documents.filter((d) => ['doc', 'docx'].includes(d.fileType)).length
  const sheetCount = documents.filter((d) => ['xls', 'xlsx'].includes(d.fileType)).length
  const imgCount = documents.filter((d) => ['png', 'jpg', 'jpeg'].includes(d.fileType)).length
  const zipCount = documents.filter((d) => d.fileType === 'zip').length

  // Only meaningful while viewing every folder at once; null hides the hint.
  // Documents keep their rows when a folder is deleted (folder_id -> NULL), so
  // this surfaces those "unfiled" files rather than letting them go unnoticed.
  const unfiledCount = selectedFolder === 'all'
    ? documents.filter((d) => !d.folder).length
    : null

  const selectedFolderName = folders.find((f) => f.id === selectedFolder)?.name || 'All Documents'

  return (
    <div>

      {/* ─── Folder Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 mb-5">

        {/* All Files */}
        <button
          onClick={() => setSelectedFolder('all')}
          className={cn(
            'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors',
            selectedFolder === 'all'
              ? 'bg-violet-600 border-violet-600 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'
          )}
        >
          <Files className="w-3.5 h-3.5" />
          All Files
        </button>

        {/* Unfiled */}
        <button
          onClick={() => setSelectedFolder('root')}
          className={cn(
            'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors',
            selectedFolder === 'root'
              ? 'bg-violet-600 border-violet-600 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:border-violet-300'
          )}
        >
          <Folder className="w-3.5 h-3.5" />
          Unfiled
        </button>

        {/* Folder chips */}
        {folders.map((f) => (
          <div
            key={f.id}
            className={cn(
              'inline-flex items-center gap-1 rounded-lg border transition-colors',
              selectedFolder === f.id
                ? 'bg-violet-600 border-violet-600'
                : 'bg-white border-slate-200 hover:border-violet-300'
            )}
          >
            {renamingFolder?.id === f.id ? (
              <form onSubmit={handleFolderRename} className="flex items-center px-1 py-0.5">
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  autoFocus
                  className="text-xs px-2 py-1 border border-slate-200 rounded w-32 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <button type="submit" className="p-1 text-green-600 hover:bg-green-50 rounded">
                  ✓
                </button>
                <button
                  type="button"
                  onClick={() => { setRenamingFolder(null); setRenameValue('') }}
                  className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                >
                  <XIcon className="w-3 h-3" />
                </button>
              </form>
            ) : (
              <>
                <button
                  onClick={() => setSelectedFolder(f.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 text-xs pl-3 py-1.5 font-medium',
                    canManage ? 'pr-1' : 'pr-3',
                    selectedFolder === f.id ? 'text-white' : 'text-slate-600'
                  )}
                >
                  <Folder className="w-3.5 h-3.5" />
                  {f.name}
                  <span className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded-full',
                    selectedFolder === f.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  )}>
                    {f.documentsCount}
                  </span>
                </button>
                {canManage && (
                  <span className="flex items-center pr-1.5 gap-0.5">
                    <button
                      title="Rename folder"
                      onClick={() => { setRenamingFolder(f); setRenameValue(f.name) }}
                      className={cn(
                        'p-1 rounded transition-colors',
                        selectedFolder === f.id
                          ? 'text-white/70 hover:text-white hover:bg-white/10'
                          : 'text-slate-300 hover:text-slate-500 hover:bg-slate-50'
                      )}
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      title="Delete folder"
                      onClick={() => setFolderDeleteTarget(f)}
                      className={cn(
                        'p-1 rounded transition-colors',
                        selectedFolder === f.id
                          ? 'text-white/70 hover:text-white hover:bg-white/10'
                          : 'text-slate-300 hover:text-red-500 hover:bg-red-50'
                      )}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </>
            )}
          </div>
        ))}

        {/* New Folder — admin/manager only */}
        {canManage && (
          <button
            onClick={() => setShowCreateFolder(true)}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-violet-400 hover:text-violet-600 font-medium transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            New Folder
          </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
        {[
          { label: 'Total Files', value: documents.length },
          { label: 'PDFs', value: documents.filter((d) => d.fileType === 'pdf').length },
          { label: 'Documents', value: documents.filter((d) => ['doc', 'docx'].includes(d.fileType)).length },
          { label: 'Spreadsheets', value: documents.filter((d) => ['xls', 'xlsx'].includes(d.fileType)).length },
          { label: 'Images', value: documents.filter((d) => ['png', 'jpg', 'jpeg'].includes(d.fileType)).length },
          { label: 'Archives', value: documents.filter((d) => d.fileType === 'zip').length },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-slate-200 px-4 py-3">
            <p className="text-xl font-semibold text-slate-800">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

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
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{formatFileSize(doc.fileSize)}</p>
                </div>
              </div>

              {/* Description */}
              {doc.description && (
                <p className="text-xs text-slate-500 mb-3 line-clamp-2 leading-relaxed">
                  {doc.description}
                </p>
              )}

              {/* Folder + Project tags */}
              {(doc.folder || doc.project) && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {doc.folder && (
                    <span className="inline-flex items-center gap-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                      <Folder className="w-3 h-3" />
                      {doc.folder.name}
                    </span>
                  )}
                  {doc.project && (
                    <span className="text-xs bg-violet-50 text-violet-600 px-2 py-0.5 rounded-md font-medium">
                      {doc.project.name}
                    </span>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-semibold',
                    getAvatarColor(doc.uploadedBy?.name)
                  )}>
                    {getInitials(doc.uploadedBy?.name)}
                  </div>
                  <span className="text-xs text-slate-500">{doc.uploadedBy?.name ?? 'Unknown'}</span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{formatDate(doc.createdAt, 'MMM dd')}</span>
                </div>

                {/* Actions — admin/manager only */}
                <div className="relative flex items-center gap-1">
                  {canManage && (
                    <>
                      {/* Move */}
                      <button
                        title="Move to folder"
                        onClick={() => setMoveTargetDoc(moveTargetDoc?.id === doc.id ? null : doc)}
                        className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                      >
                        <FolderInput className="w-3.5 h-3.5" />
                      </button>

                      {/* Move dropdown */}
                      {moveTargetDoc?.id === doc.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setMoveTargetDoc(null)}
                          />
                          <div className="absolute right-0 bottom-8 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 max-h-56 overflow-y-auto">
                            <p className="px-3 py-1.5 text-xs font-medium text-slate-400">Move to</p>
                            <button
                              onClick={() => handleMove(doc, null)}
                              className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Files className="w-3.5 h-3.5 text-slate-400" />
                              All Files (unfiled)
                            </button>
                            {folders.map((f) => (
                              <button
                                key={f.id}
                                onClick={() => handleMove(doc, f.id)}
                                disabled={doc.folder?.id === f.id}
                                className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 disabled:opacity-40"
                              >
                                <Folder className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate">{f.name}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}

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
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Filter className="w-5 h-5 text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-600">No documents found</p>
          <p className="text-xs text-slate-400 mt-1">
            {selectedFolder !== 'all'
              ? 'This folder is empty — upload a file or move one here'
              : 'Upload a file or try a different search'}
          </p>
        </div>
      )}

      {/* ─── Modals & Alert Dialogs ──────────────────────────────────────── */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open && !isDeleting) setDeleteTarget(null) }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold text-foreground">
              Delete Document?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setDeleteTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                if (deleteTarget) handleDelete(deleteTarget.id)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>
                : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={folderDeleteTarget !== null}
        onOpenChange={(open) => { if (!open && !isFolderDeleting) setFolderDeleteTarget(null) }}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold text-foreground">
              Delete Folder?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              &ldquo;{folderDeleteTarget?.name}&rdquo; will be deleted. Documents inside it are
              NOT deleted — they will be moved to All Files.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFolderDeleting} onClick={() => setFolderDeleteTarget(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isFolderDeleting}
              onClick={(e) => {
                e.preventDefault()
                if (folderDeleteTarget) handleFolderDelete(folderDeleteTarget.id)
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isFolderDeleting
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Deleting...</>
                : 'Delete Folder'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {showCreateFolder && (
        <CreateFolderModal
          onClose={() => setShowCreateFolder(false)}
          onSuccess={loadFolders}
        />
      )}

      {showUploadModal && (
        <UploadModal
          folders={folders}
          defaultFolderId={
            selectedFolder !== 'all' && selectedFolder !== 'root' ? selectedFolder : ''
          }
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            setShowUploadModal(false)
            refreshAll()
          }}
        />
      )}
    </div>
  )
}