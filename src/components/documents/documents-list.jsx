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
<<<<<<< HEAD
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
=======
    <div className="space-y-4 w-full max-w-full overflow-hidden text-xs">

      {/* ─── 1. Top Metrics Banner ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center space-x-2.5 shadow-xs">
          <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800 leading-none">{totalFiles}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Total Documents</p>
          </div>
        </div>

        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center space-x-2.5 shadow-xs">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800 leading-none">
              {formatFileSize(documents.reduce((acc, d) => acc + (d.fileSize || 0), 0))}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Storage Used</p>
          </div>
        </div>

        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center space-x-2.5 shadow-xs">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800 leading-none">{pdfCount + docCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Docs & PDFs</p>
          </div>
        </div>

        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center space-x-2.5 shadow-xs">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800 leading-none">{imgCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Images</p>
          </div>
        </div>

        <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex items-center space-x-2.5 shadow-xs">
          <div className="p-2 bg-slate-100 text-slate-600 rounded-lg">
            <Archive className="w-4 h-4" />
          </div>
          <div>
            <p className="text-base font-bold text-slate-800 leading-none">{zipCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Archives</p>
          </div>
        </div>
      </div>

      {/* ─── 2. Recently Opened Row ─────────────────────────────────────── */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3" /> Recently Opened
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {documents.slice(0, 4).map((doc) => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className="p-2 bg-white rounded-lg border border-slate-200 hover:border-violet-300 hover:shadow-xs transition cursor-pointer flex items-center space-x-2.5"
              >
                <FileIcon fileType={doc.fileType} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-slate-800 truncate leading-tight">{doc.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{doc.project?.name || 'General'}</p>
                </div>
              </div>
            ))}
          </div>
>>>>>>> e904b81 (Update export modal and document table layout)
        </div>

<<<<<<< HEAD
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

      {/* ─── Metrics Banner ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total Documents', value: totalFiles, icon: FileText, color: 'bg-violet-50 text-violet-600' },
          { label: 'Storage Used', value: formatFileSize(documents.reduce((acc, d) => acc + (d.fileSize || 0), 0)), icon: HardDrive, color: 'bg-blue-50 text-blue-600' },
          { label: 'Docs & PDFs', value: pdfCount + docCount, icon: Clock, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Spreadsheets', value: sheetCount, icon: Share2, color: 'bg-amber-50 text-amber-600' },
          { label: 'Images', value: imgCount, icon: Share2, color: 'bg-pink-50 text-pink-600' },
          { label: 'Archives', value: zipCount, icon: Archive, color: 'bg-slate-100 text-slate-600' },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="p-4 bg-white rounded-xl border border-slate-200 flex items-center space-x-3 shadow-xs">
              <div className={cn('p-3 rounded-xl shrink-0', stat.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold text-slate-800 truncate">{stat.value}</p>
                <p className="text-xs text-slate-400">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── Breadcrumb + View Toggle ────────────────────────────────────── */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 mb-4">
=======
      {/* ─── 3. Action Toolbar & Path Breadcrumbs ───────────────────────── */}
      <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
>>>>>>> e904b81 (Update export modal and document table layout)
        {/* Breadcrumb Path */}
        <div className="flex items-center space-x-1 text-[11px] font-medium text-slate-600">
          <span>Documents</span>
          <ChevronRight className="w-3 h-3 text-slate-400" />
          <span className="text-violet-600 font-semibold">{selectedFolderName}</span>
          {unfiledCount > 0 && (
            <span className="ml-2 text-slate-400">
              ({unfiledCount} unfiled)
            </span>
          )}
        </div>

<<<<<<< HEAD
        {/* Toggle View */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
          <button
            onClick={() => setViewMode('table')}
            className={cn(
              'p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition',
              viewMode === 'table' ? 'bg-white shadow-xs text-violet-600' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <List className="w-3.5 h-3.5" /> Table
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={cn(
              'p-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition',
              viewMode === 'grid' ? 'bg-white shadow-xs text-violet-600' : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grid
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 mb-3">
        Showing {filtered.length} file{filtered.length !== 1 ? 's' : ''}
      </p>

      {/* Documents — table or grid */}
      {filtered.length > 0 ? (
        viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="max-h-[520px] overflow-y-auto overflow-x-auto relative custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse min-w-[650px]">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider shadow-xs">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Project</th>
                  <th className="p-3">Folder</th>
                  <th className="p-3">Uploader</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Size</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-medium text-slate-800">
                      <div className="flex items-center space-x-2">
                        <FileIcon fileType={doc.fileType} size="sm" />
                        <span className="truncate max-w-[180px]" title={doc.name}>{doc.name}</span>
=======
        {/* View Controls & Filter Actions */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Toggle View */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                'px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition',
                viewMode === 'table' ? 'bg-white shadow-xs text-violet-600' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <List className="w-3 h-3" /> Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition',
                viewMode === 'grid' ? 'bg-white shadow-xs text-violet-600' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <LayoutGrid className="w-3 h-3" /> Grid
            </button>
          </div>

          {/* Type Filter Select */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-md text-slate-600 outline-none focus:border-violet-400"
          >
            <option value="all">All Types</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="xlsx">XLSX</option>
            <option value="png">PNG</option>
            <option value="zip">ZIP</option>
          </select>

          {/* Upload Button */}
          <Button
            onClick={() => setShowUploadModal(true)}
            className="bg-violet-600 hover:bg-violet-700 text-[11px] h-7 px-2.5 rounded-md"
          >
            <Upload className="w-3 h-3 mr-1" /> Upload File
          </Button>
        </div>
      </div>

      {/* ─── 4. Main Split View (Sidebar | Content | Preview Drawer) ────── */}
      <div className="grid grid-cols-12 gap-4 items-start w-full min-w-0">

        {/* ─── Left Sidebar Folder Navigation ──────────────────────────── */}
        <div className="col-span-12 lg:col-span-3 xl:col-span-2 bg-white rounded-lg border border-slate-200 p-2.5 space-y-2 min-w-0">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
            <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Folders</span>
            {canManage && (
              <button
                onClick={() => setShowCreateFolder(true)}
                className="text-violet-600 hover:text-violet-700 text-[11px] flex items-center gap-0.5 font-medium"
              >
                <FolderPlus className="w-3 h-3" /> New
              </button>
            )}
          </div>

          <div className="space-y-0.5">
            {/* All Files */}
            <button
              onClick={() => setSelectedFolder('all')}
              className={cn(
                'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] font-medium transition',
                selectedFolder === 'all'
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <div className="flex items-center space-x-1.5">
                <Files className="w-3.5 h-3.5 text-violet-500" />
                <span>All Documents</span>
              </div>
              <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full">
                {documents.length}
              </span>
            </button>

            {/* Unfiled */}
            <button
              onClick={() => setSelectedFolder('root')}
              className={cn(
                'w-full flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] font-medium transition',
                selectedFolder === 'root'
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <div className="flex items-center space-x-1.5">
                <Folder className="w-3.5 h-3.5 text-slate-400" />
                <span>Unfiled</span>
              </div>
            </button>

            {/* Custom Folders */}
            {folders.map((f) => (
              <div
                key={f.id}
                className={cn(
                  'group flex items-center justify-between px-2 py-1.5 rounded-md text-[11px] font-medium transition',
                  selectedFolder === f.id
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-600 hover:bg-slate-50'
                )}
              >
                {renamingFolder?.id === f.id ? (
                  <form onSubmit={handleFolderRename} className="flex items-center space-x-1 w-full">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      autoFocus
                      className="text-[11px] px-1 py-0.5 border border-violet-300 rounded w-full outline-none"
                    />
                    <button type="submit" className="text-emerald-600 hover:text-emerald-700 text-[11px]">✓</button>
                    <button
                      type="button"
                      onClick={() => { setRenamingFolder(null); setRenameValue('') }}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedFolder(f.id)}
                      className="flex items-center space-x-1.5 truncate flex-1 text-left"
                    >
                      <Folder className="w-3.5 h-3.5 text-violet-500 flex-shrink-0" />
                      <span className="truncate">{f.name}</span>
                    </button>
                    <div className="flex items-center space-x-0.5">
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded-full">
                        {f.documentsCount || 0}
                      </span>
                      {canManage && (
                        <div className="hidden group-hover:flex items-center space-x-0.5 ml-1">
                          <button
                            onClick={() => { setRenamingFolder(f); setRenameValue(f.name) }}
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            <Pencil className="w-2.5 h-2.5" />
                          </button>
                          <button
                            onClick={() => setFolderDeleteTarget(f)}
                            className="text-slate-400 hover:text-red-600 p-0.5"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Center Documents Listing ─────────────────────────────────── */}
        <div
          className={cn(
            'col-span-12 transition-all min-w-0 w-full',
            selectedDoc
              ? 'lg:col-span-6 xl:col-span-7'
              : 'lg:col-span-9 xl:col-span-10'
          )}
        >
          {filtered.length > 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col overflow-hidden w-full min-w-0">

              {viewMode === 'table' ? (
                /* Adjusted Table Area (No internal scroll container) */
                <div className="w-full min-w-0">
                  <table className="w-full text-left text-[11px] border-collapse table-fixed min-w-[650px]">
                    <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                      <tr>
                        <th className="p-2 w-[6%] text-center">S.No</th>
                        <th className="p-2 w-[32%]">Name</th>
                        <th className="p-2 w-[18%]">Project</th>
                        <th className="p-2 w-[14%]">Folder</th>
                        <th className="p-2 w-[14%]">Uploader</th>
                        <th className="p-2 w-[10%]">Date</th>
                        <th className="p-2 w-[10%]">Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {paginatedDocs.map((doc, index) => (
                        <tr
                          key={doc.id}
                          onClick={() => setSelectedDoc(doc)}
                          className={cn(
                            'hover:bg-slate-50/80 cursor-pointer transition',
                            selectedDoc?.id === doc.id ? 'bg-violet-50/60' : ''
                          )}
                        >
                          <td className="p-2 text-center font-medium text-slate-400 whitespace-nowrap">
                            {startIndex + index + 1}
                          </td>
                          <td className="p-2 font-medium text-slate-800" style={{ maxWidth: 0 }}>
                            <div className="flex items-center gap-1.5 w-full min-w-0">
                              <div className="flex-shrink-0">
                                <FileIcon fileType={doc.fileType} size="sm" />
                              </div>
                              <span 
                                className="truncate min-w-0 block w-full whitespace-nowrap overflow-hidden text-ellipsis" 
                                title={doc.name}
                              >
                                {doc.name}
                              </span>
                            </div>
                          </td>
                          <td className="p-2 text-slate-500 truncate" title={doc.project?.name}>
                            {doc.project?.name || '-'}
                          </td>
                          <td className="p-2 text-slate-500 truncate" title={doc.folder?.name}>
                            {doc.folder?.name || 'Unfiled'}
                          </td>
                          <td className="p-2 text-slate-500 truncate" title={doc.uploadedBy?.name}>
                            {doc.uploadedBy?.name || 'Unknown'}
                          </td>
                          <td className="p-2 text-slate-500 whitespace-nowrap">
                            {formatDate(doc.createdAt, 'MMM dd')}
                          </td>
                          <td className="p-2 text-slate-500 whitespace-nowrap">
                            {formatFileSize(doc.fileSize)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid Area */
                <div className="p-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {paginatedDocs.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDoc(doc)}
                        className={cn(
                          'bg-white rounded-lg border border-slate-200 p-3 hover:shadow-xs transition cursor-pointer',
                          selectedDoc?.id === doc.id ? 'border-violet-400 ring-1 ring-violet-400' : ''
                        )}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <FileIcon fileType={doc.fileType} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-slate-800 truncate leading-tight" title={doc.name}>{doc.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{formatFileSize(doc.fileSize)}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                          <span>{formatDate(doc.createdAt, 'MMM dd')}</span>
                          <span className="text-violet-600 font-medium truncate max-w-[80px]">{doc.folder?.name || 'Unfiled'}</span>
                        </div>
>>>>>>> e904b81 (Update export modal and document table layout)
                      </div>
                    </td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{doc.project?.name || '-'}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{doc.folder?.name || 'Unfiled'}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{doc.uploadedBy?.name || 'Unknown'}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{formatDate(doc.createdAt, 'MMM dd')}</td>
                    <td className="p-3 text-slate-500 whitespace-nowrap">{formatFileSize(doc.fileSize)}</td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1 text-slate-400">
                        {/* Download stays available to everyone; mutating
                            actions remain admin/manager-only, matching the
                            grid view's permission rules. */}
                        <button
                          onClick={() => handleDownload(doc)}
                          className="p-1 hover:text-violet-600 rounded transition"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {canManage && (
                          <button
                            onClick={() => setDeleteTarget(doc)}
                            className="p-1 hover:text-red-600 rounded transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

<<<<<<< HEAD
          {/* Pagination Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{filtered.length > 0 ? startIndex + 1 : 0}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(startIndex + itemsPerPage, filtered.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{filtered.length}</span> documents
            </p>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-semibold text-slate-600 px-2">
                {currentPage} / {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
=======
              {/* Compact Pagination Bar */}
              <div className="flex items-center justify-between px-3 py-2 border-t border-slate-100 bg-slate-50/60">
                <p className="text-[11px] text-slate-500">
                  Showing <span className="font-semibold text-slate-700">{filtered.length > 0 ? startIndex + 1 : 0}</span> to{' '}
                  <span className="font-semibold text-slate-700">
                    {Math.min(startIndex + itemsPerPage, filtered.length)}
                  </span>{' '}
                  of <span className="font-semibold text-slate-700">{filtered.length}</span>
                </p>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <span className="text-[11px] font-semibold text-slate-600 px-1.5">
                    {currentPage} / {totalPages || 1}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-1 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-lg border border-slate-200">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-1.5">
                <Filter className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-[11px] font-medium text-slate-600">No documents found</p>
            </div>
          )}
        </div>

        {/* ─── Right Drawer Document Details ───────────────────────────── */}
        {selectedDoc && (
          <div className="col-span-12 lg:col-span-3 xl:col-span-3 bg-white rounded-lg border border-slate-200 p-3 space-y-3 shadow-xs sticky top-4 min-w-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Document Preview</h4>
              <button onClick={() => setSelectedDoc(null)} className="text-slate-400 hover:text-slate-600">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h3 className="font-bold text-xs text-slate-800 break-words leading-snug">{selectedDoc.name}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">{selectedDoc.project?.name || 'General Project'}</p>
            </div>

            {/* Metadata list */}
            <div className="text-[11px] space-y-1.5 border-y border-slate-100 py-2.5 text-slate-600">
              <div className="flex justify-between">
                <span>Size:</span>
                <span className="font-medium text-slate-800">{formatFileSize(selectedDoc.fileSize)}</span>
              </div>
              <div className="flex justify-between">
                <span>Uploader:</span>
                <span className="font-medium text-slate-800">{selectedDoc.uploadedBy?.name || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span className="font-medium text-slate-800">{formatDate(selectedDoc.createdAt, 'MMM dd, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span>Folder:</span>
                <span className="font-medium text-violet-600">{selectedDoc.folder?.name || 'Unfiled'}</span>
              </div>
            </div>

            {/* Preview Box */}
            <div className="h-24 bg-slate-50 border border-slate-200 rounded-md flex flex-col items-center justify-center p-2 text-center">
              <FileIcon fileType={selectedDoc.fileType} size="md" />
              <p className="text-[10px] text-slate-400 mt-1">Preview canvas ready</p>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                onClick={() => handleDownload(selectedDoc)}
                className="flex items-center justify-center gap-1 border border-slate-200 py-1 rounded-md hover:bg-slate-50 font-medium text-slate-700"
              >
                <Download className="w-3 h-3" /> Download
              </button>
              {canManage && (
                <button
                  onClick={() => setDeleteTarget(selectedDoc)}
                  className="flex items-center justify-center gap-1 bg-red-50 text-red-600 py-1 rounded-md hover:bg-red-100 font-medium"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              )}
>>>>>>> e904b81 (Update export modal and document table layout)
            </div>
          </div>
        </div>
        ) : (
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
        )
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
        <AlertDialogContent className="rounded-xl p-4">
          <AlertDialogHeader>
<<<<<<< HEAD
            <AlertDialogTitle className="text-base font-semibold text-foreground">
              Delete Document?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
=======
            <AlertDialogTitle className="text-sm font-semibold text-slate-800">
              Delete Document?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
>>>>>>> e904b81 (Update export modal and document table layout)
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setDeleteTarget(null)} className="h-7 text-xs px-3">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault()
                if (deleteTarget) handleDelete(deleteTarget.id)
              }}
              className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs px-3"
            >
              {isDeleting
                ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Deleting...</>
                : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={folderDeleteTarget !== null}
        onOpenChange={(open) => { if (!open && !isFolderDeleting) setFolderDeleteTarget(null) }}
      >
        <AlertDialogContent className="rounded-xl p-4">
          <AlertDialogHeader>
<<<<<<< HEAD
            <AlertDialogTitle className="text-base font-semibold text-foreground">
              Delete Folder?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500">
              &ldquo;{folderDeleteTarget?.name}&rdquo; will be deleted. Documents inside it are
              NOT deleted — they will be moved to All Files.
=======
            <AlertDialogTitle className="text-sm font-semibold text-slate-800">
              Delete Folder?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-slate-500">
              &ldquo;{folderDeleteTarget?.name}&rdquo; will be deleted. Documents inside it are NOT deleted — they will be moved to All Documents.
>>>>>>> e904b81 (Update export modal and document table layout)
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isFolderDeleting} onClick={() => setFolderDeleteTarget(null)} className="h-7 text-xs px-3">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isFolderDeleting}
              onClick={(e) => {
                e.preventDefault()
                if (folderDeleteTarget) handleFolderDelete(folderDeleteTarget.id)
              }}
              className="bg-red-600 hover:bg-red-700 text-white h-7 text-xs px-3"
            >
              {isFolderDeleting
                ? <><Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />Deleting...</>
                : 'Delete Folder'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals for creation and upload */}
      {showUploadModal && (
        <UploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onSuccess={refreshAll}
        />
      )}

      {showCreateFolder && (
        <CreateFolderModal
          isOpen={showCreateFolder}
          onClose={() => setShowCreateFolder(false)}
          onSuccess={refreshAll}
        />
      )}
    </div>
  )
}