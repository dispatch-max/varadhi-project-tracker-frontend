// These handle all backend API calls.
// IMPORTANT:
// getAll() keeps its OLD return shape so Kanban and other modules
// that expect an ARRAY are not disturbed.

import apiClient from '@/lib/api-client'

export const tasksApi = {
  // =========================================================
  // GET ALL TASKS
  // KEEP THIS RETURN VALUE AS AN ARRAY.
  // Used by Kanban and any existing components.
  // =========================================================
  getAll: async (filters = {}, page = 1, limit = 10) => {
    const { data } = await apiClient.get('/tasks', {
      params: {
        ...filters,
        page,
        limit,
      },
    })

    return data.data
  },

  // =========================================================
  // GET PAGINATED TASKS
  // ONLY TasksList should use this.
  //
  // Unlike getAll(), this returns the complete API response
  // so TasksList can read:
  // - task rows
  // - total task count
  // - total pages
  // =========================================================
  getPaginated: async (filters = {}, page = 1, limit = 10) => {
    const { data } = await apiClient.get('/tasks', {
      params: {
        ...filters,
        page,
        limit,
      },
    })

    return data
  },

  // =========================================================
  // TASK STATS
  // =========================================================
  getStats: async () => {
    const { data } = await apiClient.get('/tasks/stats')
    return data.data
  },

  // =========================================================
  // PRIORITY BREAKDOWN
  // =========================================================
  getPriorityBreakdown: async () => {
    const { data } = await apiClient.get(
      '/tasks/priority-breakdown'
    )

    return data.data
  },

  // =========================================================
  // UPCOMING TASKS
  // =========================================================
  getUpcoming: async ({ limit = 5, days = 30 } = {}) => {
    const { data } = await apiClient.get('/tasks/upcoming', {
      params: {
        limit,
        days,
      },
    })

    return data.data
  },

  // =========================================================
  // GET SINGLE TASK
  // =========================================================
  getById: async (id) => {
    const { data } = await apiClient.get(`/tasks/${id}`)
    return data.data
  },

  // =========================================================
  // GET PROJECT TASKS
  // =========================================================
  getByProject: async (projectId) => {
    const { data } = await apiClient.get(
      `/projects/${projectId}/tasks`
    )

    return data.data
  },

  // =========================================================
  // CREATE TASK
  // =========================================================
  create: async (taskData) => {
    const { data } = await apiClient.post(
      '/tasks',
      taskData
    )

    return data.data
  },

  // =========================================================
  // UPDATE TASK
  // =========================================================
  update: async (id, taskData, baseUpdatedAt) => {
    const body = baseUpdatedAt
      ? {
          ...taskData,
          baseUpdatedAt,
        }
      : taskData

    const { data } = await apiClient.put(
      `/tasks/${id}`,
      body
    )

    return data.data
  },

  // =========================================================
  // UPDATE STATUS
  // =========================================================
  updateStatus: async (
    id,
    status,
    baseUpdatedAt
  ) => {
    const body = baseUpdatedAt
      ? {
          status,
          baseUpdatedAt,
        }
      : {
          status,
        }

    const { data } = await apiClient.patch(
      `/tasks/${id}/status`,
      body
    )

    return data.data
  },

  // =========================================================
  // DELETE TASK
  // =========================================================
  delete: async (id) => {
    await apiClient.delete(`/tasks/${id}`)
  },

  // =========================================================
  // ADD COMMENT
  // =========================================================
  addComment: async (taskId, content) => {
    const { data } = await apiClient.post(
      `/tasks/${taskId}/comments`,
      {
        content,
      }
    )

    return data.data
  },

  // =========================================================
  // DELETE COMMENT
  // =========================================================
  deleteComment: async (taskId, commentId) => {
    await apiClient.delete(
      `/tasks/${taskId}/comments/${commentId}`
    )
  },
}