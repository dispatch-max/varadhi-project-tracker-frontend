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
  // Task load + completion grouped by users.role — this schema has no team
  // or department entity, so role is the real grouping.
  getRoleUtilization: async () => {
    const { data } = await apiClient.get('/reports/role-utilization')
    return data.data
  },

  // Period-over-period deltas computed from tasks.completed_at/created_at.
  getBusinessIntelligence: async () => {
    const { data } = await apiClient.get('/reports/business-intelligence')
    return data.data
  },

  // Risk levels derived from overdue counts and project end dates.
  getRiskAnalysis: async () => {
    const { data } = await apiClient.get('/reports/risk-analysis')
    return data.data
  },

  getProjectCompletion: async () => {
    const { data } = await apiClient.get('/reports/project-completion')
    return data.data
  },
}