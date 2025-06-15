<template>
  <div class="app">
    <NotificationToast />
    <Navbar />
    <div class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <keep-alive :include="['BrowseSets']">
            <component :is="Component" :key="route.path" />
          </keep-alive>
        </transition>
      </router-view>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/common/Navbar.vue'
import Footer from '@/components/common/Footer.vue'
import NotificationToast from '@/components/common/NotificationToast.vue'

declare global {
  interface Window {
    gtag: (command: string, targetId: string, config: { page_path: string }) => void;
  }
}

const route = useRoute()

// Track page views for analytics
watch(() => route.path, (newPath) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-XXXXXXXXXX', {
      page_path: newPath
    })
  }
})

onMounted(() => {
  // Initial page view
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', 'G-XXXXXXXXXX', {
      page_path: route.path
    })
  }
})
</script>
