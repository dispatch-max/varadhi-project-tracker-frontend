import apiClient from '@/lib/api-client'

export const timeManagementApi = {
  getAll: async (filters = {}) => {
    const { data } = await apiClient.get('/time-management', { params: filters })
    return data.data
  },

  create: async (payload) => {
    const { data } = await apiClient.post('/time-management', payload)
    return data.data
  },
  checkIn: async (payload) => {
    const { data } = await apiClient.post('/time-management/check-in', payload)
    return data.data
  },

  checkOut: async (payload) => {
    const { data } = await apiClient.post('/time-management/check-out', payload)
    return data.data
  },
}
