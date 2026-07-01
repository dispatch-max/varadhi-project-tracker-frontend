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

  // Delete document
  // delete: async (id) => {
  //   await apiClient.delete(`/documents/${id}`)
  // },
  delete: async (id) => {
  const { data } = await apiClient.delete(`/documents/${id}`)
  return data.data
  },

  // Download document
  // download: async (id) => {
  //   const response = await apiClient.get(`/documents/${id}/download`, {
  //     responseType: 'blob',
  //   })
  //   return response.data
  // },
  download: async (id) => {
  const response = await apiClient.get(`/documents/${id}/download`, {
    responseType: 'blob',
  })
  return response
  },
}