// These handle all backend API calls. When  backend is ready, everything connects from here.

import apiClient from '@/lib/api-client'

export const tasksApi = {
  // Get all tasks (with optional filters)
  getAll: async (filters = {}, page = 1, limit = 10) => {
    const { data } = await apiClient.get('/tasks', {
      params: { ...filters, page, limit },
    })
    return data.data
  },

  // Get single task by ID
  getById: async (id) => {
    const { data } = await apiClient.get(`/tasks/${id}`)
    return data.data
  },

  // Get all tasks for a project
  getByProject: async (projectId) => {
    const { data } = await apiClient.get(`/projects/${projectId}/tasks`)
    return data.data
  },

  // Create new task
  create: async (taskData) => {
    const { data } = await apiClient.post('/tasks', taskData)
    return data.data
  },

  // Update task.
  // `baseUpdatedAt` is optional optimistic-concurrency (AC-15): pass the
  // `updatedAt` you last saw and the server rejects the write with 409 if the
  // row has moved on. Omit it and the call behaves exactly as it always did.
  update: async (id, taskData, baseUpdatedAt) => {
    const body = baseUpdatedAt ? { ...taskData, baseUpdatedAt } : taskData
    const { data } = await apiClient.put(`/tasks/${id}`, body)
    return data.data
  },

  // Update only the status (used in Kanban drag & drop)
  updateStatus: async (id, status, baseUpdatedAt) => {
    const body = baseUpdatedAt ? { status, baseUpdatedAt } : { status }
    const { data } = await apiClient.patch(`/tasks/${id}/status`, body)
    return data.data
  },

  // Delete task
  delete: async (id) => {
    await apiClient.delete(`/tasks/${id}`)
  },

  // Add comment to task
  addComment: async (taskId, content) => {
    const { data } = await apiClient.post(
      `/tasks/${taskId}/comments`,
      { content }
    )
    return data.data
  },

  // Delete comment
  deleteComment: async (taskId, commentId) => {
    await apiClient.delete(`/tasks/${taskId}/comments/${commentId}`)
  },
}