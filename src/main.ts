import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { createPinia } from 'pinia'
// import piniaPersist from 'pinia-plugin-persistedstate'
import GoogleSignInPlugin from 'vue3-google-login'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import { watch } from 'vue'
import './polyfills/modulepreload'
import { cachePlugin } from '@/plugins/cache'

// Production configuration
const isProd = import.meta.env.PROD
const API_URL = import.meta.env.VITE_API_URL || (isProd ? 'https://flashcard-server-production.up.railway.app' : 'http://localhost:5000')

// Configure axios defaults
console.log('[Debug] Configuring axios')
axios.defaults.baseURL = API_URL
axios.defaults.timeout = 30000 // 30 seconds

// Extend Axios request config type
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    __requestKey?: string;
    __resolve?: (value: any) => void;
    __reject?: (reason?: any) => void;
  }
}

// NProgress
console.log('[Debug] Setting up NProgress')
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
NProgress.configure({ 
  showSpinner: true,
  minimum: 0.1,
  easing: 'ease',
  speed: 800
})

// Create app with error handling
const app = createApp(App)

// Enhanced error handler with more details
app.config.errorHandler = (err, instance, info) => {
  console.error('[Debug] Vue Error:', err)
  console.error('[Debug] Error Component:', instance?.$options?.name || 'Unknown')
  console.error('[Debug] Error Info:', info)
  console.error('[Debug] Error Stack:', err instanceof Error ? err.stack : 'No stack trace')
  
  // Log component tree if available
  if (instance) {
    console.error('[Debug] Component Tree:', instance.$parent ? 'Has parent' : 'Root component')
  }
}

// Performance monitoring
app.config.performance = isProd

// Initialize Pinia without persistence for testing
const pinia = createPinia()
// pinia.use(piniaPersist)
app.use(pinia)

// Google Sign In Configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
if (!GOOGLE_CLIENT_ID) {
  console.error('[Debug] VITE_GOOGLE_CLIENT_ID is not defined')
}
app.use(GoogleSignInPlugin, {
  clientId: GOOGLE_CLIENT_ID
})

// Initialize plugins
app.use(cachePlugin)
app.use(router)

// Initialize auth
const auth = useAuthStore()

// Initialize auth without top-level await
auth.checkAuth().catch(error => {
  console.error('[Debug] Auth check failed:', error)
})

// Mount app with error boundary
try {
  app.mount('#app')
} catch (error) {
  console.error('[Debug] App mount failed:', error)
}

// Request deduplication cache
const requestCache = new Map<string, Promise<any>>()

// Add request deduplication interceptor
axios.interceptors.request.use(config => {
  const cacheKey = `${config.method}-${config.url}-${JSON.stringify(config.params || {})}`
  if (requestCache.has(cacheKey)) {
    return Promise.reject(new Error('Duplicate request'))
  }
  const promise = new Promise((resolve, reject) => {
    config.adapter = async (config) => {
      try {
        const response = await axios(config)
        resolve(response)
        return response
      } catch (error) {
        reject(error)
        throw error
      }
    }
  })
  requestCache.set(cacheKey, promise)
  return config
})

axios.interceptors.response.use(
  response => {
    const cacheKey = `${response.config.method}-${response.config.url}-${JSON.stringify(response.config.params || {})}`
    requestCache.delete(cacheKey)
    return response
  },
  error => {
    if (error.config) {
      const cacheKey = `${error.config.method}-${error.config.url}-${JSON.stringify(error.config.params || {})}`
      requestCache.delete(cacheKey)
    }
    return Promise.reject(error)
  }
)

// Global axios error handling with retry logic and caching
const responseCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

axios.interceptors.response.use(
  res => {
    if (res.config.method === 'get') {
      const cacheKey = `${res.config.url}-${JSON.stringify(res.config.params || {})}`
      responseCache.set(cacheKey, {
        data: res.data,
        timestamp: Date.now()
      })
    }
    return res
  },
  async (err) => {
    const config = err.config

    // Check cache for GET requests
    if (config.method === 'get') {
      const cacheKey = `${config.url}-${JSON.stringify(config.params || {})}`
      const cachedResponse = responseCache.get(cacheKey)
      
      if (cachedResponse && Date.now() - cachedResponse.timestamp < CACHE_TTL) {
        return { ...cachedResponse, config, status: 200, statusText: 'OK' }
      }
    }

    // Retry logic for network errors or rate limits
    if (!config._retry && (err.code === 'ECONNABORTED' || err.response?.status === 429)) {
      config._retry = true
      config.timeout = 60000

      try {
        return await axios(config)
      } catch (retryError) {
        return Promise.reject(retryError)
      }
    }

    // Handle auth errors
    if (err.response?.status === 401) {
      auth?.logout()
      auth?.setMessage('Session expired. Please log in again.')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// JWT watcher
watch(
  () => auth?.jwt,
  (newJwt) => {
    if (newJwt) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${newJwt}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  },
  { immediate: true }
)

// Router guards with error handling
router.beforeEach(async (_to, _from, next) => {
  NProgress.start()
  try {
    next()
  } catch (error) {
    console.error('[Debug] Navigation error:', error)
    next(false)
  }
})

router.afterEach(() => {
  NProgress.done()
})
