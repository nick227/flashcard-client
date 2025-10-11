import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { nextTick } from 'vue'

// Lazy load components

const Home = () => import('../views/Home.vue')
const Study = () => import('../views/Study.vue')
const BrowseSets = () => import('../views/BrowseSets.vue')
const LoginRegister = () => import('../views/LoginRegister.vue')
const About = () => import('../views/About.vue')
const Privacy = () => import('../views/Privacy.vue')
const Terms = () => import('../views/Terms.vue')
const NotFound = () => import('../views/NotFound.vue')

const routes: RouteRecordRaw[] = [
  { 
    path: '/', 
    component: Home,
    meta: { 
      title: 'Flash Card Academy'
    }
  },
  { 
    path: '/study', 
    component: Study,
    meta: { 
      title: 'Study'
    }
  },
  { 
    path: '/study/:setId', 
    component: Study,
    props: true,
    meta: { 
      title: 'Study Set'
    }
  },
  { 
    path: '/sets/:setId',
    name: 'SetView',
    component: () => import('@/views/SetView.vue'),
    props: true,
    meta: { 
      title: 'Set Details'
    }
  },
  { 
    path: '/browse',
    component: BrowseSets,
    meta: { 
      title: 'Browse Sets'
    },
    children: [
      { 
        path: '', 
        component: BrowseSets
      },
      { 
        path: ':category', 
        component: BrowseSets,
        props: true
      }
    ]
  },
  { 
    path: '/login', 
    component: LoginRegister,
    meta: { 
      title: 'Login / Register',
      guest: true
    }
  },
  {
    path: '/creator',
    name: 'CreatorDashboard',
    component: () => import('@/views/creator/CreatorDashboard.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Creator Dashboard'
    }
  },
  {
    path: '/creator/wizard/:setId?',
    name: 'SetWizard',
    component: () => import('@/views/creator/SetWizard.vue'),
    props: true,
    meta: { 
      requiresAuth: true, 
      title: 'Set Wizard'
    }
  },
  {
    path: '/create',
    name: 'CreateSet',
    component: () => import('@/views/creator/SetWizard.vue'),
    meta: { 
      requiresAuth: true, 
      title: 'Create Set'
    }
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('@/views/UserProfile.vue'),
    meta: { 
      requiresAuth: true,
      title: 'Profile'
    }
  },
  {
    path: '/u/:userName',
    name: 'PublicProfile',
    component: () => import('@/views/PublicProfile.vue'),
    props: true,
    meta: { 
      requiresAuth: false,
      title: 'Public Profile'
    }
  },
  {
    path: '/purchase-success',
    name: 'PurchaseSuccess',
    component: () => import('../views/PurchaseSuccess.vue'),
    meta: {
      requiresAuth: true,
      title: 'Purchase Successful'
    }
  },
  {
    path: '/about',
    name: 'About',
    component: About,
    meta: {
      requiresAuth: false,
      title: 'About'
    }
  },
  {
    path: '/privacy',
    name: 'Privacy',
    component: Privacy,
    meta: {
      requiresAuth: false,
      title: 'Privacy Policy'
    }
  },
  {
    path: '/terms',
    name: 'Terms',
    component: Terms,
    meta: {
      requiresAuth: false,
      title: 'Terms of Service'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: {
      title: 'Page Not Found'
    }
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    // Return saved position for back/forward navigation
    if (savedPosition) {
      return savedPosition
    }
    
    // Scroll to anchor if hash is present
    if (to.hash) {
      return new Promise(resolve => {
        nextTick(() => {
          const element = document.querySelector(to.hash)
          if (element) {
            resolve({ el: to.hash, behavior: 'smooth' })
          } else {
            resolve({ top: 0, left: 0 })
          }
        })
      })
    }
    
    // For route changes, scroll to top instantly to prevent content flashing
    // Smooth behavior can cause timing issues with lazy-loaded components
    return { top: 0, left: 0 }
  }
})

// Force scroll to top helper - multiple strategies to handle all edge cases
function forceScrollToTop() {
  // Strategy 1: Immediate scroll
  window.scrollTo(0, 0)
  
  // Strategy 2: Next frame (after current render)
  requestAnimationFrame(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  })
  
  // Strategy 3: After double RAF (ensures DOM is fully rendered)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    })
  })
}

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()
  
  // Force scroll to top on navigation (unless using back/forward)
  if (!window.history.state.position) {
    forceScrollToTop()
  }
  
  // Update page title
  document.title = `${to.meta.title} | Flashcard Academy` || 'Flashcard Academy'
  
  // Skip auth check for guest routes
  if (to.meta.guest) {
    if (auth.isAuthenticated) {
      return next('/')
    }
    return next()
  }

  // Handle authentication
  if (!auth.isAuthenticated) {
    try {
      await auth.checkAuth()
    } catch (error) {
      // Only redirect to login if not already going there
      if (to.path !== '/login') {
        return next('/login')
      }
    }
  }

  // Auth required routes
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next('/login')
  }

  // Role required routes
  if (to.meta.requiresRole && auth.user?.role !== to.meta.requiresRole) {
    return next('/')
  }

  next()
})

// Additional scroll enforcement after each navigation completes
router.afterEach((_to, _from) => {
  // Don't interfere with back/forward navigation
  if (window.history.state.position) {
    return
  }
  
  // Force scroll to top with delay to handle lazy-loaded components
  nextTick(() => {
    forceScrollToTop()
    
    // Fallback timeout for very slow components
    setTimeout(() => {
      window.scrollTo(0, 0)
    }, 100)
  })
})
