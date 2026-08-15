import axios from 'axios'
import { API_BASE_URL } from '@/constants'
import { clearOfflineCaches } from '@/lib/offline-cache'
import { clearAll as clearAllOutbox } from '@/lib/outbox'
import { useConnectivityStore } from '@/store/connectivity.store'
import { getFromStorage, removeFromStorage } from '@/utils'

// Ensure we have a full backend URL at runtime. Prefer NEXT_PUBLIC_API_URL.
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

console.debug('API base URL:', BASE)

const apiClient = axios.create({
  baseURL: BASE,
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
  (response) => {
    // Proof the API is reachable — outranks navigator.onLine, which stays true
    // on a captive portal. Clears the offline banner as soon as data arrives.
    useConnectivityStore.getState().reportNetworkSuccess()
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired → clear and redirect to login
      removeFromStorage('varadhi_token')
      removeFromStorage('varadhi_user')
      // The cookie must die with the localStorage copy. proxy.js gates routes on
      // the cookie ALONE, so leaving it behind creates a redirect loop that locks
      // the user out entirely: middleware sees the cookie and admits them to
      // /dashboard, the API call finds no token in storage and 401s back to
      // /auth/login, and middleware bounces them to /dashboard again. Clearing
      // only one of the two stores is never correct.
      if (typeof document !== 'undefined') {
        document.cookie =
          'varadhi_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      }
      // Drop cached API responses too. A 401 means this session is over, and
      // whoever loads the app next on this device must not read the previous
      // user's data out of the service worker cache. Fire-and-forget: the
      // redirect below must not wait on storage, and clearOfflineCaches never
      // rejects.
      clearOfflineCaches()
      // The outbox goes too. A 401 gives no reliable way to know whose session
      // just died, so scoping the clear isn't possible here — and leaving
      // queued mutations behind risks them replaying under whoever logs in
      // next. Losing them is the safe failure; replaying them as another user
      // is not. Deliberately unawaited, like the cache clear above.
      clearAllOutbox()
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    } else if (!error.response) {
      // No response at all — DNS failure, refused connection, timeout, or the
      // device really is offline. This is the signal navigator.onLine misses.
      useConnectivityStore.getState().reportNetworkError()
    }
    return Promise.reject(error)
  }
)

export default apiClient