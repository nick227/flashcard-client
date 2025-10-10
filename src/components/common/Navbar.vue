<template>
  <nav class="navbar pb-2">
    <div class="navbar-inner container-main">
      <div class="navbar-masthead">
        <router-link to="/" class="navbar-logo">
          <svg width="40" height="40" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"
            class="logo-svg">
            <rect x="4" y="8" width="36" height="28" rx="8" fill="currentColor" class="logo-primary" />
            <rect x="12" y="16" width="20" height="14" rx="4" fill="currentColor" class="logo-secondary" />
            <rect x="18" y="20" width="8" height="6" rx="2" fill="currentColor" class="logo-accent" />
          </svg>
          <span class="logo-text">FlashCard Academy</span>
        </router-link>
      </div>
      <div class="navbar-actions">
        <router-link to="/creator" class="link">
          Create
        </router-link>
        <div class="navbar-divider"></div>
        <AuthWidget />
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import AuthWidget from '@/components/common/AuthWidget.vue'
import { useRouter } from 'vue-router'

// Handle HMR
if (import.meta.hot) {
  import.meta.hot.accept()
}
</script>
<style scoped>
.link {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  background: var(--color-primary);
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: background-color 0.2s;
  background: var(--color-accent);
}
</style>