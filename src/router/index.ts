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
    if (savedPosition) return savedPosition
  
    return new Promise(resolve => {
      nextTick(() => {
        if (to.hash && document.querySelector(to.hash)) {
          resolve({ el: to.hash, behavior: 'smooth' })
        } else {
          resolve({ top: 0, behavior: 'smooth' })
        }
      })
    })
  }
})

// Navigation guards
router.beforeEach(async (to, _from, next) => {
  const auth = useAuthStore()
  
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
