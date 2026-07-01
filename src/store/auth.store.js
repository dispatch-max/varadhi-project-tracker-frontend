import { create } from 'zustand'
import { getFromStorage, saveToStorage, removeFromStorage } from '@/utils'

export const useAuthStore = create((set) => ({
  user: getFromStorage('varadhi_user'),
  token: getFromStorage('varadhi_token'),
  isAuthenticated: !!getFromStorage('varadhi_token'),
  isLoading: false,

  // Call this after successful login
  setAuth: (user, token) => {
    saveToStorage('varadhi_token', token)
    saveToStorage('varadhi_user', user)
    set({ user, token, isAuthenticated: true })
  },

  // Call this on logout
  clearAuth: () => {
    removeFromStorage('varadhi_token')
    removeFromStorage('varadhi_user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  setLoading: (isLoading) => set({ isLoading }),
}))