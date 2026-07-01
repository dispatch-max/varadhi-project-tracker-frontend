// These handle all backend API calls. When backend is ready, everything connects from here.

import apiClient from '@/lib/api-client'
import { isValid, parseISO } from 'date-fns'

// Surfaces bad data at the boundary so backend issues are visible early.
// It does NOT mutate the value — the UI guards (formatDate, etc.) handle rendering safely.
function normalizeUser(user) {
  if (!user) return user
  if (
    process.env.NODE_ENV !== 'production' &&
    user.createdAt != null &&
    !isValid(parseISO(String(user.createdAt)))
  ) {
    console.warn('[usersApi] invalid createdAt for user', user.id, '→', user.createdAt)
  }
  return user
}

export const usersApi = {
  // Get all users (Admin only)
  getAll: async (filters = {}) => {
    const { data } = await apiClient.get('/users', { params: filters })
    // `?? []` guards against an unexpected response shape so the caller's
    // `users.filter(...)` can never throw "Cannot read properties of undefined".
    return (data?.data ?? []).map(normalizeUser)
  },

  // Get single user
  getById: async (id) => {
    const { data } = await apiClient.get(`/users/${id}`)
    return normalizeUser(data.data)
  },

  // Invite user by email (Admin only)
  invite: async (email, role) => {
    const { data } = await apiClient.post('/users/invite', { email, role })
    return data.data
  },

  // Update user role (Admin only)
  updateRole: async (id, role) => {
    const { data } = await apiClient.patch(`/users/${id}/role`, { role })
    return data.data
  },

  // Deactivate user (Admin only)
  deactivate: async (id) => {
    const { data } = await apiClient.patch(`/users/${id}/deactivate`)
    return data.data
  },

  // Update own profile
  updateProfile: async (profileData) => {
    const { data } = await apiClient.put('/users/profile', profileData)
    return data.data
  },

  // Upload avatar
  uploadAvatar: async (formData) => {
    const { data } = await apiClient.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data.data
  },
}


// // These handle all backend API calls. When  backend is ready, everything connects from here.

// import apiClient from '@/lib/api-client'

// export const usersApi = {
//   // Get all users (Admin only)
//   getAll: async (filters = {}) => {
//     const { data } = await apiClient.get('/users', { params: filters })
//     return data.data
//   },

//   // Get single user
//   getById: async (id) => {
//     const { data } = await apiClient.get(`/users/${id}`)
//     return data.data
//   },

//   // Invite user by email (Admin only)
//   invite: async (email, role) => {
//     const { data } = await apiClient.post('/users/invite', { email, role })
//     return data.data
//   },

//   // Update user role (Admin only)
//   updateRole: async (id, role) => {
//     const { data } = await apiClient.patch(`/users/${id}/role`, { role })
//     return data.data
//   },

//   // Deactivate user (Admin only)
//   deactivate: async (id) => {
//     const { data } = await apiClient.patch(`/users/${id}/deactivate`)
//     return data.data
//   },

//   // Update own profile
//   updateProfile: async (profileData) => {
//     const { data } = await apiClient.put('/users/profile', profileData)
//     return data.data
//   },

//   // Upload avatar
//   uploadAvatar: async (formData) => {
//     const { data } = await apiClient.post('/users/avatar', formData, {
//       headers: { 'Content-Type': 'multipart/form-data' },
//     })
//     return data.data
//   },
// }