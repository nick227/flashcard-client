import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { router } from './router'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'
import GoogleSignInPlugin from 'vue3-google-login'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import { watch } from 'vue'
import './polyfills/modulepreload'

// Production configuration
const isProd = import.meta.env.PROD
const API_URL = isProd ? 'https://api.flashcardacademy.com' : 'http://localhost:5000'

// Configure axios defaults
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

// Error handler with production logging
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err)
  if (isProd) {
    // Add production error reporting here (e.g., Sentry)
    console.error('Component:', instance?.$options?.name || 'Unknown')
    console.error('Info:', info)
  } else {
    console.error('Component:', instance)
    console.error('Info:', info)
  }
}

// Performance monitoring
app.config.performance = isProd

// Initialize Pinia with persistence
const pinia = createPinia()
pinia.use(piniaPersist)
app.use(pinia)

// Google Sign In Configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
if (!GOOGLE_CLIENT_ID) {
  console.error('VITE_GOOGLE_CLIENT_ID is not defined')
}
app.use(GoogleSignInPlugin, {
  clientId: GOOGLE_CLIENT_ID
})

// Router
app.use(router)

// Auth setup
const auth = useAuthStore()

// Set initial auth header
axios.defaults.headers.common['Authorization'] = auth.jwt ? `Bearer ${auth.jwt}` : ''

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>()

// Development logging with request deduplication
if (!isProd) {
  axios.interceptors.request.use(request => {
    const requestKey = [
      request.method?.toLowerCase(),
      request.url,
      JSON.stringify(request.params || {}),
      JSON.stringify(request.data || {}),
      request.headers?.['Authorization'] || ''
    ].join('|')
    
    if (pendingRequests.has(requestKey)) {
      console.log('Deduplicating request:', requestKey)
      return Promise.reject({
        __CANCEL__: true,
        message: 'Request deduplicated',
        promise: pendingRequests.get(requestKey)
      })
    }
    
    const requestPromise = new Promise((resolve, reject) => {
      request.__requestKey = requestKey
      request.__resolve = resolve
      request.__reject = reject
    })
    
    pendingRequests.set(requestKey, requestPromise)
    requestPromise.finally(() => {
      if (pendingRequests.get(requestKey) === requestPromise) {
        pendingRequests.delete(requestKey)
      }
    })
    
    return request
  })

  axios.interceptors.response.use(
    response => {
      if (response.config.__requestKey) {
        const requestPromise = pendingRequests.get(response.config.__requestKey)
        if (requestPromise) {
          response.config.__resolve?.(response)
        }
      }
      return response
    },
    error => {
      if (error.config?.__requestKey) {
        const requestPromise = pendingRequests.get(error.config.__requestKey)
        if (requestPromise) {
          error.config.__reject?.(error)
        }
      }
      return Promise.reject(error)
    }
  )
}

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
      auth.logout()
      auth.setMessage('Session expired. Please log in again.')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// JWT watcher
watch(
  () => auth.jwt,
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
    console.error('Navigation error:', error)
    next(false)
  }
})

router.afterEach(() => {
  NProgress.done()
})

// Mount app
app.mount('#app')