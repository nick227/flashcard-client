import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

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
      title: 'Home'
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
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

// Navigation guards
router.beforeEach(async (_to, _from, next) => {
  const auth = useAuthStore()
  
  console.log('Navigation guard - Route:', _to.path)
  console.log('Navigation guard - Auth state:', {
    isAuthenticated: auth.isAuthenticated,
    isEducator: auth.isEducator,
    user: auth.user
  })
  
  // Update page title
  document.title = `${_to.meta.title} | Flashcard Academy` || 'Flashcard Academy'
  
  // Handle authentication
  if (auth.jwt && !auth.user) {
    console.log('JWT exists but no user, fetching user...')
    try {
      await auth.fetchUser()
      console.log('User fetched:', auth.user)
    } catch (error) {
      console.error('Failed to fetch user:', error)
      auth.logout()
      auth.setMessage('Session expired. Please log in again.')
      return next('/login')
    }
  }

  // Guest routes
  if (_to.meta.guest && auth.isAuthenticated) {
    console.log('Guest route accessed while authenticated, redirecting to home')
    return next('/')
  }

  // Auth required routes
  if (_to.meta.requiresAuth && !auth.isAuthenticated) {
    console.log('Auth required route accessed without auth, redirecting to login')
    auth.setMessage('Please log in to access this page.')
    return next('/login')
  }

  // Role required routes
  if (_to.meta.requiresRole && !auth.isEducator) {
    console.log('Role required route accessed without proper role:', {
      requiredRole: _to.meta.requiresRole,
      userRole: auth.user?.role
    })
    auth.setMessage('You need to be an educator to access this page.')
    return next('/')
  }

  console.log('Navigation guard - Proceeding to route')
  next()
})
