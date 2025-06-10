import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi } from '@/api'
import { cacheService } from '@/plugins/cache'
import { useRouter } from 'vue-router'

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const jwt = ref<string | null>(localStorage.getItem('jwt'))
  const message = ref<string | null>(null)
  const lastAuthCheck = ref<number>(0)
  const AUTH_CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

  const isAuthenticated = computed(() => !!user.value)

  const setJwt = (token: string | null) => {
    jwt.value = token
    if (token) {
      localStorage.setItem('jwt', token)
    } else {
      localStorage.removeItem('jwt')
    }
  }

  const setUser = (userData: User | null) => {
    user.value = userData
  }

  const setMessage = (msg: string | null) => {
    message.value = msg
  }

  async function login(credentials: { email: string; password: string }) {
    if (!isBrowser) return
    loading.value = true
    error.value = null
    try {
      const response = await authApi.login(credentials)
      setJwt(response.token)
      setUser(response.user)
      setMessage(null)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(userData: { name: string; email: string; password: string }) {
    if (!isBrowser) return
    loading.value = true
    error.value = null
    try {
      const response = await authApi.register(userData)
      setJwt(response.token)
      setUser(response.user)
      setMessage(null)
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    if (!isBrowser) return
    loading.value = true
    error.value = null
    try {
      await authApi.logout()
    } catch (err: any) {
      console.error('Logout error:', err)
    } finally {
      setJwt(null)
      setUser(null)
      setMessage(null)
      router.push('/login')
      loading.value = false
    }
  }

  async function checkAuth() {
    if (!isBrowser) return null
    
    // Check if we've recently checked auth
    const now = Date.now()
    if (now - lastAuthCheck.value < AUTH_CHECK_INTERVAL) {
      return user.value
    }
    
    loading.value = true
    error.value = null
    try {
      // Try to get user from cache first
      const cachedUser = await cacheService.get('user') as User | null
      if (cachedUser) {
        user.value = cachedUser
        lastAuthCheck.value = now
        return cachedUser
      }

      // Try to get JWT from localStorage
      const storedJwt = localStorage.getItem('jwt')
      if (!storedJwt) {
        return null
      }

      const response = await authApi.checkAuth()
      if (response) {
        user.value = response
        setJwt(storedJwt)
        // Cache user data
        if (isBrowser) {
          cacheService.set('user', response, 24 * 60 * 60 * 1000) // 24 hours
        }
        lastAuthCheck.value = now
        return response
      }
      return null
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Auth check failed'
      user.value = null
      setJwt(null)
      if (isBrowser) {
        localStorage.removeItem('jwt')
        cacheService.delete('user')
      }
      return null
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