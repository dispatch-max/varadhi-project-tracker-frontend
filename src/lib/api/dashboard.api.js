// These handle all backend API calls. When  backend is ready, everything connects from here.

import apiClient from '@/lib/api-client'

export const dashboardApi = {
  // Get dashboard stats
  getStats: async () => {
    const { data } = await apiClient.get('/dashboard/stats')
    return data.data
  },

  // Get recent activity feed
  getActivity: async () => {
    const { data } = await apiClient.get('/dashboard/activity')
    return data.data
  },

  // Get project progress
  getProjects: async () => {
    const { data } = await apiClient.get('/dashboard/projects')
    return data.data
  },

  // Get sprint burndown data
  getBurndown: async (projectId) => {
    const { data } = await apiClient.get(`/dashboard/burndown/${projectId}`)
    return data.data
  },


}