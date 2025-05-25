<template>
  <nav class="navbar mb-2">
    <div class="navbar-inner">
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
        <router-link to="/" class="navbar-link" active-class="active">Home</router-link>
        <router-link to="/browse" class="navbar-link" active-class="active">Browse Sets</router-link>
        <router-link to="/creator" class="navbar-link" active-class="active">Start Teaching</router-link>
        <div class="navbar-divider"></div>
        <AuthWidget />
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import AuthWidget from '@/components/common/AuthWidget.vue'
</script>