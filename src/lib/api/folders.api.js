
import apiClient from '@/lib/api-client'

export const foldersApi = {
  // Get all folders with document counts
  getAll: async () => {
    const { data } = await apiClient.get('/folders')
    return data.data
  },

  // Create a folder (admin/manager)
  create: async (name) => {
    const { data } = await apiClient.post('/folders', { name })
    return data.data
  },

  // Rename a folder (admin/manager)
  rename: async (id, name) => {
    const { data } = await apiClient.patch(`/folders/${id}`, { name })
    return data.data
  },

  // Delete a folder — its documents are kept and become unfiled (admin/manager)
  delete: async (id) => {
    const { data } = await apiClient.delete(`/folders/${id}`)
    return data.data
  },
}

