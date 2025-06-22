<template>
  <div class="app">
    <NotificationToast />
    <Navbar />
    <div class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component
            v-if="!shouldKeepAlive"
            :is="Component"
            :key="route.fullPath + '-' + (route.query.set ?? '')"
          />
          <keep-alive v-else>
            <component
              :is="Component"
              :key="route.fullPath + '-' + (route.query.set ?? '')"
            />
          </keep-alive>
        </transition>
      </router-view>
    </div>
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/common/Navbar.vue'
import Footer from '@/components/common/Footer.vue'
import NotificationToast from '@/components/common/NotificationToast.vue'

const route = useRoute()

// Declare gtag globally for TypeScript
declare global {
  interface Window {
    gtag?: (command: string, targetId: string, config: { page_path: string }) => void;
  }
}

const shouldKeepAlive = computed(() =>
  ['BrowseSets'].includes(route.name as string)
)

watch(() => route.path, (newPath) => {
  if (window.gtag) {
    window.gtag('config', 'G-XXXXXXXXXX', {
      page_path: newPath
    })
  }
})

onMounted(() => {
  if (window.gtag) {
    window.gtag('config', 'G-XXXXXXXXXX', {
      page_path: route.path
    })
  }
})
</script>
