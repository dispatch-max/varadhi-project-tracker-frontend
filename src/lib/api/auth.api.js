// These handle all backend API calls. When  backend is ready, everything connects from here.

import apiClient from '@/lib/api-client'

export const authApi = {
  // Login with email & password
  login: async (credentials) => {
    const { data } = await apiClient.post('/auth/login', credentials)
    return data.data
  },

  // Register new user
  register: async (registerData) => {
    const { data } = await apiClient.post('/auth/register', registerData)
    return data.data
  },

  // Send forgot password email
  forgotPassword: async (email) => {
    const { data } = await apiClient.post('/auth/forgot-password', { email })
    return data
  },

  // Reset password using token from email
  resetPassword: async (token, password) => {
    const { data } = await apiClient.post('/auth/reset-password', {
      token,
      password,
    })
    return data
  },

  // Get currently logged in user
  getMe: async () => {
    const { data } = await apiClient.get('/auth/me')
    return data.data
  },

  // Logout
  logout: async () => {
    await apiClient.post('/auth/logout')
  },
  
  // Verify an invite token — returns { email, role }
  verifyInvite: async (token) => {
    const { data } = await apiClient.get(`/auth/invite/${token}`)
    return data.data
  },
  
  // Accept an invite — { token, name, password } -> { user, token }
  acceptInvite: async (payload) => {
    const { data } = await apiClient.post('/auth/accept-invite', payload)
    return data.data
  }
  
}