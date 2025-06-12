import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi } from '@/api'
import { cacheService } from '@/plugins/cache'
import { useRouter } from 'vue-router'
import { api } from '@/api'

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined'

export const useAuthStore = defineStore('auth', () => {
  const router = useRouter()
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const jwt = ref<string | null>(isBrowser ? localStorage.getItem('jwt') : null)
  const message = ref<string | null>(null)
  const lastAuthCheck = ref<number>(0)

  const isAuthenticated = computed(() => !!user.value)

  const setJwt = (token: string | null) => {
    jwt.value = token
    if (isBrowser) {
      if (token) {
        localStorage.setItem('jwt', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      } else {
        localStorage.removeItem('jwt')
        delete api.defaults.headers.common['Authorization']
      }
    }
  }

  // Initialize JWT from localStorage on store creation
  if (isBrowser) {
    const storedJwt = localStorage.getItem('jwt')
    if (storedJwt) {
      setJwt(storedJwt)
    }
  }

  const setUser = (userData: User | null) => {
    console.log('Setting user data:', userData)
    if (userData) {
      // Ensure bio is preserved exactly as received
      user.value = {
        ...userData,
        bio: userData.bio // Don't modify the bio value at all
      }
      if (isBrowser) {
        cacheService.set('user', user.value, 24 * 60 * 60 * 1000) // 24 hours
      }
    } else {
      user.value = null
    }
  }

  const setMessage = (msg: string | null) => {
    message.value = msg
  }

  async function login(credentials: { email: string; password: string }) {
    if (!isBrowser) return
    loading.value = true
    error.value = null
    try {
      // Clear any existing auth data first
      setJwt(null)
      setUser(null)
      setMessage(null)
      if (isBrowser) {
        localStorage.removeItem('jwt')
        cacheService.delete('user')
      }

      // Attempt login
      const response = await authApi.login(credentials)
      console.log('Login response:', response)

      if (!response?.token || !response?.user) {
        throw new Error('Invalid login response')
      }

      // Set JWT first
      setJwt(response.token)

      // Then set user data
      setUser(response.user)

      // Verify the token works by making a test request
      try {
        const verifyResponse = await api.get('/users/me')
        console.log('Token verification response:', verifyResponse.data)
        
        if (!verifyResponse.data) {
          throw new Error('Token verification failed')
        }
        
        // Update user data with verified response
        setUser(verifyResponse.data)
        setMessage(null)
        return response
      } catch (verifyError) {
        console.error('Token verification failed:', verifyError)
        // Clear everything if verification fails
        setJwt(null)
        setUser(null)
        if (isBrowser) {
          localStorage.removeItem('jwt')
          cacheService.delete('user')
        }
        throw new Error('Failed to verify authentication')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      error.value = err.response?.data?.message || 'Login failed'
      // Ensure everything is cleared on error
      setJwt(null)
      setUser(null)
      if (isBrowser) {
        localStorage.removeItem('jwt')
        cacheService.delete('user')
      }
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
    
    // Clear everything first to prevent any retries
    setJwt(null)
    setUser(null)
    setMessage(null)
    if (isBrowser) {
      localStorage.removeItem('jwt')
      cacheService.delete('user')
    }
    
    // Navigate to login immediately
    router.push('/login')
    
    // Then attempt to call the logout endpoint, but don't wait for it
    try {
      await authApi.logout()
    } catch (err: any) {
      console.error('Logout API call failed:', err)
      // Ignore the error since we've already cleared everything
    } finally {
      loading.value = false
    }
  }

  const checkAuth = async () => {
    if (!isBrowser) return false

    // Check if we've checked recently (within 5 minutes)
    const now = Date.now()
    if (lastAuthCheck.value && now - lastAuthCheck.value < 5 * 60 * 1000) {
      return isAuthenticated.value
    }

    try {
      // Try to get user from cache first
      const cachedUser = await cacheService.get('user') as User | null
      if (cachedUser) {
        console.log('Using cached user data:', cachedUser)
        setUser(cachedUser)
        lastAuthCheck.value = now
        return true
      }

      // If no cached user, try to get fresh data
      const token = localStorage.getItem('jwt')
      if (!token) {
        console.log('No JWT found in localStorage')
        return false
      }

      // Set the token in the auth store
      setJwt(token)

      // Get fresh user data
      try {
        const response = await api.get('/users/me')
        console.log('Fresh user data from /me:', response.data)
        if (response.data) {
          setUser(response.data)
          lastAuthCheck.value = now
          return true
        }
      } catch (error: any) {
        console.error('Failed to fetch user data:', error)
        // If we get a 401/403, clear the invalid token
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          setJwt(null)
          setUser(null)
          if (isBrowser) {
            localStorage.removeItem('jwt')
            cacheService.delete('user')
          }
        }
      }
      return false
    } catch (error) {
      console.error('Auth check failed:', error)
      // Clear JWT and user data on error
      setJwt(null)
      setUser(null)
      if (isBrowser) {
        localStorage.removeItem('jwt')
        cacheService.delete('user')
      }
      return false
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