import axios from 'axios'
import { API_BASE_URL } from '@/constants'
import { getFromStorage, removeFromStorage } from '@/utils'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Inject auth token into every request
apiClient.interceptors.request.use(
  (config) => {
    const token = getFromStorage('varadhi_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired → clear and redirect to login
      removeFromStorage('varadhi_token')
      removeFromStorage('varadhi_user')
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient