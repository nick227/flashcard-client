<template>
  <div v-if="isInitialized" class="auth-widget">
    <div @click="router.push('/profile')" v-if="auth.isAuthenticated" class="user-info link">
      <div class="avatar-container">
        <img 
          v-if="!imageLoadError" 
          :src="auth.user?.image || defaultAvatar" 
          :alt="auth.user?.name || 'User avatar'"
          @error="handleImageError"
          @load="handleImageLoad"
          class="avatar"
        />
        <div v-else class="avatar-fallback">
          {{ userInitials }}  
        </div>
      </div>
      <div v-if="isDesktop" class="user-details">
        <span class="user-name">{{ auth.user?.name || 'User' }}</span>
      </div>
    </div>
    <router-link v-else to="/login" class="link">
      Sign In
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'


const router = useRouter()
const auth = useAuthStore()
const isInitialized = ref(false)
const imageLoadError = ref(false)
const defaultAvatar = '/images/default-avatar.png'
const isDesktop = ref(window.innerWidth >= 768)

const handleImageError = () => {
  imageLoadError.value = true
}

const handleImageLoad = () => {
  imageLoadError.value = false
}

const userInitials = computed(() => {
  const name = auth.user?.name || auth.user?.email || ''
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const handleResize = () => {
  isDesktop.value = window.innerWidth >= 768
}

onMounted(() => {
  handleResize()
  window.addEventListener('resize', handleResize)
  isInitialized.value = true
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.auth-widget {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.avatar-container {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: white;
  font-weight: 500;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
  color: var(--color-text);
}

.user-email {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.link {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;
}

.link:hover,
.link:active {
  background: var(--color-primary);
}
</style> 