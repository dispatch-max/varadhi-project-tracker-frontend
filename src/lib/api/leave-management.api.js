import apiClient from '@/lib/api-client'

export const leaveManagementApi = {
  getAll: async (filters = {}) => {
    const { data } = await apiClient.get('/leave-management', { params: filters })
    return data.data
  },

  create: async (payload) => {
    const { data } = await apiClient.post('/leave-management', payload)
    return data.data
  },

  updateStatus: async (id, status) => {
    const { data } = await apiClient.patch(`/leave-management/${id}/status`, { status })
    return data.data
  },
}
