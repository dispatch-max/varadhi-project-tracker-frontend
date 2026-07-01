// These handle all backend API calls for the Reports page.

import apiClient from '@/lib/api-client'

export const reportsApi = {
  // Task distribution by status (pie chart)
  getTaskStatus: async () => {
    const { data } = await apiClient.get('/reports/task-status')
    return data.data
  },

  // Per-member task breakdown (bar chart)
  getMemberWorkload: async () => {
    const { data } = await apiClient.get('/reports/member-workload')
    return data.data
  },

  // Per-project completed vs total (horizontal bar chart)
  getProjectCompletion: async () => {
    const { data } = await apiClient.get('/reports/project-completion')
    return data.data
  },
}