<template>
  <div class="auth-widget flex items-center gap-2">
    <template v-if="auth.isAuthenticated && auth.user">
      <a href="/profile" class="flex items-center gap-2">
      <img :src="auth.user.image || defaultAvatar" alt="avatar" class="avatar" />
    </a>
    <a href="/profile" class="flex items-center gap-2">
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
const auth = useAuthStore()
const defaultAvatar = 'https://ui-avatars.com/api/?name=U&background=2563eb&color=fff&size=32'

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