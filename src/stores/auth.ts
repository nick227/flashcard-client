import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { api } from '@/api'
import { cacheService } from '@/plugins/cache'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const jwt = ref<string | null>(null)
  const message = ref<string>('')

  const isAuthenticated = computed(() => !!user.value)

  function setMessage(msg: string) {
    message.value = msg
  }

  function setUser(userData: User | null) {
    user.value = userData
  }

  async function login(credentials: { email: string; password: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/auth/login', credentials)
      user.value = response.data.user
      jwt.value = response.data.token
      // Cache user data
      cacheService.set('user', response.data.user, 24 * 60 * 60 * 1000) // 24 hours
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(userData: { name: string; email: string; password: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post('/auth/register', userData)
      user.value = response.data.user
      jwt.value = response.data.token
      // Cache user data
      cacheService.set('user', response.data.user, 24 * 60 * 60 * 1000) // 24 hours
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    loading.value = true
    error.value = null
    try {
      await api.post('/auth/logout')
      user.value = null
      jwt.value = null
      // Clear user cache
      cacheService.delete('user')
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Logout failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function checkAuth() {
    loading.value = true
    error.value = null
    try {
      // Try to get user from cache first
      const cachedUser = await cacheService.get('user') as User | null
      if (cachedUser) {
        user.value = cachedUser
        return cachedUser
      }

      const response = await api.get('/auth/me')
      user.value = response.data
      // Cache user data
      cacheService.set('user', response.data, 24 * 60 * 60 * 1000) // 24 hours
      return response.data
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Auth check failed'
      user.value = null
      jwt.value = null
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    jwt,
    message,
    isAuthenticated,
    setMessage,
    setUser,
    login,
    register,
    logout,
    checkAuth
  }
}) 