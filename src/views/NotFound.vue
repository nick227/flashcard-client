<template>
  <div class="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
    <div class="max-w-lg w-full text-center">
      <!-- 404 Icon -->
      <div class="mb-8">
        <i class="fas fa-exclamation-circle text-6xl text-indigo-600"></i>
      </div>

      <!-- Error Message -->
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        Page Not Found
      </h1>
      <p class="text-lg text-gray-600 mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <!-- Action Buttons -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <router-link 
          to="/" 
          class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
        >
          <i class="fas fa-home mr-2"></i>
          Go Home
        </router-link>
        <button 
          @click="goBack" 
          class="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
        >
          <i class="fas fa-arrow-left mr-2"></i>
          Go Back
        </button>
      </div>

      <!-- Help Text -->
      <p class="mt-8 text-sm text-gray-500">
        Need help? <router-link to="/contact" class="text-indigo-600 hover:text-indigo-500">Contact Support</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.back()
}
</script>

<style scoped>
/* No additional styles needed as we're using Tailwind classes */
</style> 