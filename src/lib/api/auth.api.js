import apiClient from '@/lib/api-client'

/*
 * Auth API.
 *
 * Nothing here handles tokens. Every endpoint below either sets or clears
 * httpOnly cookies server-side; the browser attaches them automatically because
 * the axios instance sets `withCredentials`. Responses no longer carry a token
 * field — if you find code reading `data.token`, it is left over from the
 * pre-cookie design and is reading undefined.
 */
export const authApi = {
  // Returns { user }. Cookies arrive in the response headers.
  login: async (credentials) => {
    const { data } = await apiClient.post('/auth/login', credentials)
    return data.data
  },

  register: async (registerData) => {
    const { data } = await apiClient.post('/auth/register', registerData)
    return data.data
  },

  forgotPassword: async (email) => {
    const { data } = await apiClient.post('/auth/forgot-password', { email })
    return data
  },

  resetPassword: async (token, password) => {
    const { data } = await apiClient.post('/auth/reset-password', {
      token,
      password,
    })
    return data
  },

  getMe: async () => {
    const { data } = await apiClient.get('/auth/me')
    return data.data
  },

  /*
   * Ends THIS session only.
   *
   * No arguments: the server identifies the session from the cookie. The old
   * signature read a session id out of sessionStorage and posted it in the
   * body, which let a client end any session whose id it could guess.
   */
  logout: async () => {
    const { data } = await apiClient.post('/auth/logout')
    return data
  },

  // Returns { revokedCount } — how many OTHER sessions the server signed out
  // as a consequence. Changing a password invalidating other devices is a
  // server-side security property, not a session-management feature.
  changePassword: async (currentPassword, newPassword) => {
    const { data } = await apiClient.put('/auth/change-password', {
      currentPassword,
      newPassword,
    })
    return data.data
  },

  verifyInvite: async (token) => {
    const { data } = await apiClient.get(`/auth/invite/${token}`)
    return data.data
  },

  acceptInvite: async (payload) => {
    const { data } = await apiClient.post('/auth/accept-invite', payload)
    return data.data
  },
}
