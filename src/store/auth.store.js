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
    // The token lives in two places — localStorage (read by api-client) and a
    // cookie (read by proxy.js). Clearing it here rather than leaving it to each
    // caller keeps them from drifting apart: a surviving cookie makes the
    // middleware treat a signed-out user as authenticated.
    if (typeof document !== 'undefined') {
      document.cookie =
        'varadhi_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
    set({ user: null, token: null, isAuthenticated: false })
  },

  setLoading: (isLoading) => set({ isLoading }),
}))