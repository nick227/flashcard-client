<template>
  <div class="auth-widget flex items-center gap-2">
    <template v-if="auth.isAuthenticated && auth.user">
      <a href="/profile" class="flex items-center gap-2">
        <img 
          v-if="!imageLoadError" 
          :src="auth.user.image || defaultAvatar" 
          alt="avatar" 
          class="avatar"
          @error="handleImageError"
          @load="handleImageLoad"
        />
        <div v-else class="avatar avatar-fallback">
          {{ getInitials(auth.user.name || auth.user.email) }}
        </div>
      </a>
      <a v-if="isDesktop" href="/profile" class="flex items-center gap-2">
        <span class="user-email">{{ auth.user.email }}</span>
      </a>
    </template>
    <template v-else>
      <router-link to="/login" class="button button-accent px-4 py-1 text-sm">Login / Register</router-link>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { ref, watch } from 'vue'

const auth = useAuthStore()
const defaultAvatar = 'https://ui-avatars.com/api/?name=U&background=2563eb&color=fff&size=32'
const imageLoadError = ref(false)
const isDesktop = ref(window.innerWidth > 768)

function handleImageError() {
  imageLoadError.value = true
}

function handleImageLoad() {
  imageLoadError.value = false
}

function getInitials(input: string): string {
  if (!input) return 'U'
  
  // Handle email addresses
  if (input.includes('@')) {
    return input.charAt(0).toUpperCase()
  }
  
  // Clean and normalize the input
  const cleanName = input
    .replace(/[^a-zA-Z\s]/g, '') // Remove special characters
    .trim()
    .split(/\s+/) // Split on any whitespace
    
  if (cleanName.length === 0) return 'U'
  
  // Get initials, handling single names
  const initials = cleanName.length === 1
    ? cleanName[0].slice(0, 2).toUpperCase()
    : cleanName
        .slice(0, 2)
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
  
  return initials || 'U'
}

// Reset error state when user or image changes
watch(
  () => [auth.user?.id, auth.user?.image],
  () => {
    imageLoadError.value = false
  },
  { deep: true }
)

console.log('AuthWidget: user', auth.user)
console.log('AuthWidget: isAuthenticated', auth.isAuthenticated)
</script>

<style scoped>
.auth-widget {
  min-width: 0;
}
.avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  object-fit: cover;
  background: #e5e7eb;
  flex-shrink: 0; /* Prevent avatar from shrinking */
}
.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2563eb;
  color: white;
  font-weight: 600;
  font-size: 0.875rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: 0.5px;
}
.user-email {
  font-size: 0.98em;
  color: var(--color-text);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 