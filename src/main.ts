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

// Router guards with error handling
router.beforeEach(async (_to, _from, next) => {
  NProgress.start()
  try {
    // Add any route-specific logic here
    next()
  } catch (error) {
    console.error('Navigation error:', error)
    next(false)
  }
})

router.afterEach(() => {
  NProgress.done()
})

// Create app with error handling
const app = createApp(App)

// Error handler
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', instance)
  console.error('Info:', info)
}

// Performance monitoring
if (import.meta.env.PROD) {
  app.config.performance = true
}

// Initialize Pinia with persistence
const pinia = createPinia()
pinia.use(piniaPersist)
app.use(pinia)

// Google Sign In Configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1073484039132-kcld0v58e4k7el7hbp16m23j1b5e4joe.apps.googleusercontent.com'
app.use(GoogleSignInPlugin, {
  clientId: GOOGLE_CLIENT_ID
})

// Router
app.use(router)

// Auth setup
const auth = useAuthStore()

// Axios configuration
axios.defaults.timeout = 30000 // 30 seconds
axios.defaults.headers.common['Authorization'] = auth.jwt ? `Bearer ${auth.jwt}` : ''

// Request deduplication cache
const pendingRequests = new Map<string, Promise<any>>()

// Development logging with request deduplication
if (import.meta.env.DEV) {
  axios.interceptors.request.use(request => {
    // Create a unique key for the request that includes all relevant parts
    const requestKey = [
      request.method?.toLowerCase(),
      request.url,
      JSON.stringify(request.params || {}),
      JSON.stringify(request.data || {}),
      request.headers?.['Authorization'] || ''
    ].join('|')
    
    // Check if there's a pending request with the same key
    if (pendingRequests.has(requestKey)) {
      console.log('Deduplicating request:', requestKey)
      const existingPromise = pendingRequests.get(requestKey)!
      
      // Return a new promise that will resolve/reject with the existing request
      return Promise.reject({
        __CANCEL__: true,
        message: 'Request deduplicated',
        promise: existingPromise
      })
    }
    
    // Create a new promise for this request
    const requestPromise = new Promise((resolve, reject) => {
      request.__requestKey = requestKey
      request.__resolve = resolve
      request.__reject = reject
    })
    
    // Store the pending request
    pendingRequests.set(requestKey, requestPromise)
    
    // Set up cleanup for the request
    requestPromise.finally(() => {
      if (pendingRequests.get(requestKey) === requestPromise) {
        pendingRequests.delete(requestKey)
      }
    })
    
    console.log('Starting Request:', requestKey)
    return request
  })

  axios.interceptors.response.use(
    response => {
      // Resolve the request promise
      if (response.config.__requestKey) {
        const requestPromise = pendingRequests.get(response.config.__requestKey)
        if (requestPromise) {
          response.config.__resolve?.(response)
        }
      }
      console.log('Response:', response.config.__requestKey)
      return response
    },
    error => {
      // Reject the request promise
      if (error.config?.__requestKey) {
        const requestPromise = pendingRequests.get(error.config.__requestKey)
        if (requestPromise) {
          error.config.__reject?.(error)
        }
      }
      console.error('Response Error:', error.config?.__requestKey)
      return Promise.reject(error)
    }
  )
}

// Global axios error handling with retry logic and caching
const responseCache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

axios.interceptors.response.use(
  res => {
    // Cache successful GET requests
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

    // If we haven't retried yet and it's a network error or 429
    if (!config._retry && (err.code === 'ECONNABORTED' || err.response?.status === 429)) {
      config._retry = true
      config.timeout = 60000 // Increase timeout for retry to 60 seconds

      try {
        return await axios(config)
      } catch (retryError) {
        return Promise.reject(retryError)
      }
    }

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

// Mount app
app.mount('#app')