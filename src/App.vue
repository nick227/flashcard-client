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
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/common/Navbar.vue'
import Footer from '@/components/common/Footer.vue'
import NotificationToast from '@/components/common/NotificationToast.vue'

const route = useRoute()

const shouldKeepAlive = computed(() =>
  ['BrowseSets'].includes(route.name as string)
)
</script>
