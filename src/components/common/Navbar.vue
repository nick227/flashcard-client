<template>
  <nav class="navbar mb-2 pb-2">
    <div class="navbar-inner container-main">
      <div class="navbar-masthead">
        <router-link to="/" class="navbar-logo">
          <svg width="40" height="40" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" class="logo-svg">
            <rect x="4" y="8" width="36" height="28" rx="8" fill="currentColor" class="logo-primary"/>
            <rect x="12" y="16" width="20" height="14" rx="4" fill="currentColor" class="logo-secondary"/>
            <rect x="18" y="20" width="8" height="6" rx="2" fill="currentColor" class="logo-accent"/>
          </svg>
          <span class="logo-text">FlashCard Academy</span>
        </router-link>
      </div>
      <div class="navbar-actions">
        <a href="/" class="navbar-link" active-class="active">Home</a>
        <a href="/browse" class="navbar-link" active-class="active">Browse</a>
        <a href="/creator" class="navbar-link" active-class="active">Create</a>
        <div class="navbar-divider"></div>
        <AuthWidget />
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import AuthWidget from '@/components/common/AuthWidget.vue'

// Handle HMR
if (import.meta.hot) {
  import.meta.hot.accept()
}
</script>