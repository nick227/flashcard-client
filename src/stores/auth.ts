import { defineStore } from 'pinia'
import { api } from '@/api'
import piniaPersist from 'pinia-plugin-persistedstate'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  jwt: string | null
  loading: boolean
  error: string | null
  message: string
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    jwt: null,
    loading: false,
    error: null,
    message: ''
  }),

  getters: {
    isAuthenticated: (state) => !!state.jwt,
    isAdmin: (state) => state.user?.role === 'admin',
    isEducator: (state) => state.user?.role === 'educator'
  },

  actions: {
    setAuth(user: User, token: string) {
      this.user = user
      this.jwt = token
    },

    clearAuth() {
      this.user = null
      this.jwt = null
    },

    async login(email: string, password: string) {
      try {
        this.loading = true;
        this.error = null;
        const res = await api.post('/auth/login', { email, password });
        this.setAuth(res.data.user, res.data.token);
        this.clearMessage();
        return res.data;
      } catch (err: any) {
        this.error = err.response?.data?.message || 'Login failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async register(userData: any) {
      try {
        const res = await api.post('/auth/register', userData);
        this.setAuth(res.data.user, res.data.token);
        return res.data;
      } catch (err) {
        throw err;
      }
    },

    async logout() {
      console.log('AuthStore: logout called')
      try {
        await api.post('/auth/logout');
      } catch (err) {
        console.error('Logout error:', err);
      } finally {
        this.clearAuth();
        this.setMessage('Logged out.');
      }
    },

    setMessage(msg: string) {
      this.message = msg
    },

    clearMessage() {
      this.message = ''
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
    },
  },
  persist: true,
}) 