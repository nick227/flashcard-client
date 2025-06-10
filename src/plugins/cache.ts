import type { App } from 'vue'
import { CacheService } from '@/services/cache/CacheService'

// Create singleton instance
export const cacheService = new CacheService()

export const cachePlugin = {
  install: (app: App) => {
    // Make cache service available globally
    app.provide('cache', cacheService)
    app.config.globalProperties.$cache = cacheService
  }
}

// Type augmentation for Vue
declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $cache: CacheService
  }
} 