// These handle all backend API calls. When  backend is ready, everything connects from here.

import apiClient from '@/lib/api-client'

export const documentsApi = {
  // Get all documents
  getAll: async (filters = {}) => {
    const { data } = await apiClient.get('/documents', { params: filters })
    return data.data
  },

  // Get documents for a project
  getByProject: async (projectId) => {
    const { data } = await apiClient.get(`/projects/${projectId}/documents`)
    return data.data
  },

  // Upload document
  upload: async (formData, onUploadProgress) => {
    const { data } = await apiClient.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
    return data.data
  },

  //  // Move a document to a folder (folderId) or to All Files (null)
  move: async (id, folderId) => {
    const { data } = await apiClient.patch(`/documents/${id}/move`, { folderId })
    return data.data
  },

  delete: async (id) => {
  const { data } = await apiClient.delete(`/documents/${id}`)
  return data.data
  },


  download: async (id) => {
  const response = await apiClient.get(`/documents/${id}/download`, {
    responseType: 'blob',
  })
  return response
  },
}