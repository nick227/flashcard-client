import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Study from '../views/Study.vue'
import BrowseSets from '../views/BrowseSets.vue'
import LoginRegister from '../views/LoginRegister.vue'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  { path: '/', component: Home },
  { path: '/study', component: Study },
  { path: '/study/:setId', component: Study },
  { 
    path: '/sets/:setId',
    name: 'SetView',
    component: () => import('@/views/SetView.vue'),
    props: true
  },
  { 
    path: '/browse',
    component: BrowseSets,
    children: [
      { path: '', component: BrowseSets },
      { path: ':category', component: BrowseSets }
    ]
  },
  { path: '/login', component: LoginRegister },
  {
    path: '/creator',
    name: 'CreatorDashboard',
    component: () => import('@/views/creator/CreatorDashboard.vue'),
    meta: { requiresAuth: true, requiresRole: 'educator' }
  },
  {
    path: '/creator/wizard/:setId?',
    name: 'SetWizard',
    component: () => import('@/views/creator/SetWizard.vue'),
    meta: { requiresAuth: true, requiresRole: 'educator' }
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('@/views/UserProfile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/u/:userName',
    name: 'PublicProfile',
    component: () => import('@/views/PublicProfile.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/purchase-success',
    name: 'PurchaseSuccess',
    component: () => import('../views/PurchaseSuccess.vue'),
    meta: {
      requiresAuth: true
    }
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, from, next) => {
  const auth = useAuthStore()
  if (auth.jwt && !auth.user) {
    await auth.fetchUser()
  }
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    auth.setMessage('Please log in to access this page.')
    return next('/login')
  }
  if (to.meta.requiresOwnership && auth.user?.id !== to.params.id) {
    auth.setMessage('You can only access your own data.')
    return next('/unauthorized')
  }
  next()
})
