import { createApp } from 'vue'
console.log('App mounted (start of main.ts)')
import './style.css'
import App from './App.vue'
import { router } from './router'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { createPinia } from 'pinia'
import piniaPersist from 'pinia-plugin-persistedstate'
import GoogleSignInPlugin  from 'vue3-google-login'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import { watch } from 'vue'

// NProgress
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
NProgress.configure({ showSpinner: false })

router.beforeEach((_to, _from, next) => {
  NProgress.start()
  next()
})

router.afterEach(() => {
  NProgress.done()
})

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPersist)

app.use(pinia)

// Google Sign In Configuration
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1073484039132-kcld0v58e4k7el7hbp16m23j1b5e4joe.apps.googleusercontent.com'
console.log('=== Google Sign In Configuration ===')
console.log('Client ID:', GOOGLE_CLIENT_ID)
console.log('Current origin:', window.location.origin)
console.log('Full URL:', window.location.href)
console.log('==================================')

app.use(GoogleSignInPlugin, {
  clientId: GOOGLE_CLIENT_ID
})
app.use(router)

// Set JWT on axios if present
const auth = useAuthStore()
console.log('JWT in main.ts:', auth.jwt)
if (auth.jwt) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${auth.jwt}`
}
console.log('Axios Authorization:', axios.defaults.headers.common['Authorization'])

// Handle 401 errors globally
console.log('Setting up axios interceptor')
axios.interceptors.response.use(
  res => res,
  err => {
    console.log('Axios interceptor caught error:', err)
    if (err.response?.status === 401) {
      auth.logout()
      auth.setMessage('Session expired. Please log in again.')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
console.log('Axios interceptor set')

// Add a watcher to always sync the axios header with the JWT
watch(
  () => auth.jwt,
  (newJwt) => {
    if (newJwt) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${newJwt}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
    console.log('Watcher updated axios Authorization:', axios.defaults.headers.common['Authorization'])
  },
  { immediate: true }
)

app.mount('#app')
console.log('App mounted (after app.mount)')