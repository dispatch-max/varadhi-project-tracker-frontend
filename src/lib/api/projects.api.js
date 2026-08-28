// These handle all backend API calls. When  backend is ready, everything connects from here.
import apiClient from '@/lib/api-client'

export const projectsApi = {
  // Get all projects (with optional filters)
  getAll: async (filters = {}, page = 1, limit = 10) => {
    const { data } = await apiClient.get('/projects', {
      params: { ...filters, page, limit },
    })
    return data.data
  },

  // Get single project by ID
  getById: async (id) => {
    const { data } = await apiClient.get(`/projects/${id}`)
    return data.data
  },
  // Get all members. Unwraps the standard envelope like every sibling method —
  // the previous version referenced an undefined `api` and returned the raw
  // axios response, so any caller would have thrown.
  getMembers: async () => {
    const { data } = await apiClient.get('/users')
    return data.data
  },
  // Create new project
  create: async (projectData) => {
    const { data } = await apiClient.post('/projects', projectData)
    return data.data
  },

  // Update project
  update: async (id, projectData) => {
    const { data } = await apiClient.put(`/projects/${id}`, projectData)
    return data.data
  },

  // Archive project
  archive: async (id) => {
    const { data } = await apiClient.patch(`/projects/${id}/archive`)
    return data.data
  },

  // Delete project
  delete: async (id) => {
    await apiClient.delete(`/projects/${id}`)
  },

  // Add member to project
  addMember: async (projectId, userId) => {
    const { data } = await apiClient.post(
      `/projects/${projectId}/members`,
      { userId }
    )
    return data.data
  },
  
  // Remove member from project
  removeMember: async (projectId, userId) => {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`)
  },
}