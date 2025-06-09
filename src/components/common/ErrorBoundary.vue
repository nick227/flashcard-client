<template>
  <div class="error-boundary">
    <div class="error-content">
      <i class="fas fa-exclamation-circle text-4xl text-red-500 mb-4"></i>
      <h2 class="text-xl font-semibold mb-2">{{ title }}</h2>
      <p class="text-gray-600 mb-4">{{ message }}</p>
      <button 
        @click="handleRetry" 
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  error?: Error
}>()

const emit = defineEmits<{
  (e: 'retry'): void
}>()

const title = ref('Something went wrong')
const message = ref('An unexpected error occurred. Please try again.')

if (props.error) {
  title.value = props.error.name || 'Error'
  message.value = props.error.message || 'An unexpected error occurred. Please try again.'
}

const handleRetry = () => {
  emit('retry')
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 2rem;
  text-align: center;
}

.error-content {
  max-width: 400px;
}
</style> 