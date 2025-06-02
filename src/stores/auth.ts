import { defineStore } from 'pinia'
import { api } from '@/api'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  jwt: string | null
  refreshToken: string | null
  loading: boolean
  error: string | null
  message: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    jwt: null,
    refreshToken: null,
    loading: false,
    error: null,
    message: ''
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    isAdmin: (state) => state.user?.role === 'admin',
    isEducator: (state) => state.user?.role === 'educator'
  },

  actions: {
    setAuth(user: User, token: string, refreshToken: string) {
      this.user = user
      this.jwt = token
      this.refreshToken = refreshToken
    },

    clearAuth() {
      this.user = null
      this.jwt = null
      this.refreshToken = null
    },

    setMessage(message: string) {
      this.message = message
    },

    clearMessage() {
      this.message = ''
    },

    async login(email: string, password: string) {
      try {
        this.loading = true
        this.error = null
        const res = await api.post('/auth/login', { email, password })
        this.setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
        this.clearMessage()
        return res.data
      } catch (err: any) {
        this.error = err.response?.data?.error || 'Login failed'
        throw err
      } finally {
        this.loading = false
      }
    },

    async refreshToken() {
      if (!this.refreshToken) {
        throw new Error('No refresh token available')
      }

      try {
        const res = await api.post('/auth/refresh-token', {
          refreshToken: this.refreshToken
        })
        this.jwt = res.data.accessToken
        this.refreshToken = res.data.refreshToken
        return res.data
      } catch (err: any) {
        this.clearAuth()
        throw err
      }
    },

    async logout() {
      console.log('AuthStore: logout called')
      try {
        await api.post('/auth/logout')
      } catch (err) {
        console.error('Logout error:', err)
      } finally {
        this.clearAuth()
        this.setMessage('Logged out.')
      }
    },

    async fetchUser() {
      if (!this.jwt) {
        console.log('AuthStore: fetchUser called, but no JWT')
        return
      }
      console.log('AuthStore: fetchUser, JWT:', this.jwt)
      console.log('AuthStore: Authorization header:', api.defaults.headers.common['Authorization'])
      try {
        const res = await api.get('/users/me')
        console.log('AuthStore: /users/me response', res.data)
        this.user = res.data
      } catch (e) {
        console.error('AuthStore: /users/me failed', e)
        this.logout()
      }
    }
  },
  persist: {
    key: 'auth',
    storage: localStorage
  }
}) 