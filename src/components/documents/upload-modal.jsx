'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Upload, File, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { FileIcon } from './file-icon'
import { formatFileSize } from '@/utils'
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '@/constants'
import { documentsApi } from '@/lib/api/documents.api'
import { projectsApi } from '@/lib/api/projects.api'

export function UploadModal({ onClose, onSuccess, folders = [], defaultFolderId = '' }) {


  const fileInputRef = useRef(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const [description, setDescription] = useState('')
  const [projectId, setProjectId] = useState('')
  const [folderId, setFolderId] = useState(defaultFolderId)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)


  const [projects, setProjects] = useState([])
const [projectsLoading, setProjectsLoading] = useState(true)
const [projectsError, setProjectsError] = useState(false)

async function loadProjects() {
  setProjectsLoading(true)
  setProjectsError(false)
  try {
    const response = await projectsApi.getAll()


    const list = response?.data ?? response ?? []


    setProjects(Array.isArray(list) ? list : [])
  } catch (err) {
    console.error('PROJECT LOAD ERROR =>', err.response?.data || err)

    setProjects([])
    setProjectsError(true)
  } finally {
    setProjectsLoading(false)
  }
}

useEffect(() => {
  loadProjects()
}, [])

  function getFileExtension(filename) {
    return filename.split('.').pop()?.toLowerCase() || 'file'
  }

  function validateFile(file) {
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 10MB limit.'
    }
    // if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    //   return 'File type not allowed. Use PDF, DOC, XLS, PNG, JPG or ZIP.'
    // }
    const ext = file.name.split('.').pop()?.toLowerCase()

const allowedExtensions = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'png',
  'jpg',
  'jpeg',
  'zip',
]

if (!allowedExtensions.includes(ext)) {
  return 'File type not allowed. Use PDF, DOC, XLS, PNG, JPG or ZIP.'
}
    return null
  }

  function handleFileSelect(file) {
    setError('')
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }
    setSelectedFile(file)
  }

  function handleInputChange(e) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleDragOver(e) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave() {
    setIsDragOver(false)
  }

  function handleDrop(e) {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  async function handleUpload() {
    if (!selectedFile) return
    setError('')
    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('description', description)
      if (projectId) formData.append('projectId', projectId)
        if (folderId) formData.append('folderId', folderId)

      await documentsApi.upload(formData, (progressEvent) => {
        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        )
        setUploadProgress(percent)
      })

      setIsSuccess(true)
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Upload failed. Please try again.'
      )
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && !isUploading && onClose()}
    >
      <div className="bg-card rounded-2xl w-full max-w-md shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">
            Upload Document
          </h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="text-slate-400 hover:text-muted-foreground p-1 rounded-lg hover:bg-background disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Success */}
          {isSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              File uploaded successfully!
            </div>
          )}

          {/* Drop Zone */}
          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                ${isDragOver
                  ? 'border-violet-400 bg-violet-50'
                  : 'border-border hover:border-violet-300 hover:bg-background'
                }
              `}
            >
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Drop your file here or{' '}
                <span className="text-violet-600">browse</span>
              </p>
              <p className="text-xs text-slate-400">
                PDF, DOC, XLS, PNG, JPG, ZIP · Max 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
                onChange={handleInputChange}
              />
            </div>
          ) : (
            /* Selected File Preview */
            <div className="border border-border rounded-xl p-4 flex items-center gap-3">
              <FileIcon
                fileType={getFileExtension(selectedFile.name)}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {formatFileSize(selectedFile.size)}
                </p>
                {/* Upload Progress */}
                {isUploading && (
                  <div className="mt-2">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {uploadProgress}% uploaded
                    </p>
                  </div>
                )}
              </div>
              {!isUploading && (
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-slate-400 hover:text-red-500 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <input
              id="description"
              type="text"
              placeholder="Brief description of this document..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUploading}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-slate-400"
            />
          </div>

          {/* Project */}{/* Project */}
<div className="space-y-1.5">
  <Label htmlFor="projectId">Link to Project (optional)</Label>

  {/* ===== KEEP YOUR OLD PROJECT SELECT EXACTLY AS IT WAS ===== */}
  <select
    id="projectId"
    value={projectId}
    onChange={(e) => setProjectId(e.target.value)}
    disabled={isUploading || projectsLoading}
    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-card"
  >
    <option value="">
      {projectsLoading ? 'Loading projects...' : 'Select a project...'}
    </option>

    {projects.map((p) => (
      <option key={p.id} value={p.id}>
        {p.name}
      </option>
    ))}
  </select>

  {projectsError && (
    <p className="text-amber-600 text-xs">
      Couldn't load projects.{' '}
      <button
        type="button"
        onClick={loadProjects}
        className="underline font-medium"
      >
        Retry
      </button>
    </p>
  )}
</div>

{/* ===== PASTE CLAUDE'S CODE BELOW THIS ===== */}
{!defaultFolderId && (
<div className="space-y-1.5">
  <Label htmlFor="folderId">Folder (optional)</Label>

  <select
    id="folderId"
    value={folderId}
    onChange={(e) => setFolderId(e.target.value)}
    disabled={isUploading}
    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-card"
  >
    <option value="">No folder (All Files)</option>

    {folders.map((f) => (
      <option key={f.id} value={f.id}>
        {f.name}
      </option>
    ))}
  </select>
</div>

  )}
          {/* <div className="space-y-1.5">
            <Label htmlFor="projectId">Link to Project (optional)</Label>
           <select
              id="folderId"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              disabled={isUploading}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 bg-card"
            >
              <option value="">No folder (All Files)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>

            {projectsError && (
  <p className="text-amber-600 text-xs">
    Couldn&apos;t load projects.{' '}
    <button type="button" onClick={loadProjects} className="underline font-medium">
      Retry
    </button>
  </p>
)}

          </div> */}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || isSuccess}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isUploading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading...</>
              ) : isSuccess ? (
                <><CheckCircle2 className="w-4 h-4 mr-2" />Uploaded!</>
              ) : (
                <><Upload className="w-4 h-4 mr-2" />Upload</>
              )}
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}