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
    setUser(user: User | null) {
      this.user = user
    },

    setJwt(jwt: string | null) {
      this.jwt = jwt
    },

    setRefreshToken(refreshToken: string | null) {
      this.refreshToken = refreshToken
    },

    setMessage(message: string) {
      this.message = message
    },

    async login(credentials: { email: string; password: string }) {
      try {
        const res = await api.post('/auth/login', credentials)
        this.setUser(res.data.user)
        this.setJwt(res.data.token)
        this.setRefreshToken(res.data.refreshToken)
        this.setMessage('')
        return res.data
      } catch (error) {
        this.error = 'Login failed. Please check your credentials.'
        throw error
      }
    },

    async register(userData: { name: string; email: string; password: string }) {
      try {
        const res = await api.post('/auth/register', userData)
        this.setUser(res.data.user)
        this.setJwt(res.data.token)
        this.setRefreshToken(res.data.refreshToken)
        return res.data
      } catch (error) {
        this.error = 'Registration failed. Please try again.'
        throw error
      }
    },

    logout() {
      this.setUser(null)
      this.setJwt(null)
      this.setRefreshToken(null)
      this.setMessage('')
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