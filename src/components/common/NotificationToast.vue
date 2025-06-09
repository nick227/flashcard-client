<template>
  <Transition
    enter-active-class="transform ease-out duration-300 transition"
    enter-from-class="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
    enter-to-class="translate-y-0 opacity-100 sm:translate-x-0"
    leave-active-class="transition ease-in duration-100"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="message"
      class="fixed bottom-0 right-0 mb-4 mr-4 w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5"
    >
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            <i
              :class="[
                'text-xl',
                {
                  'text-green-400 fas fa-check-circle': type === 'success',
                  'text-red-400 fas fa-exclamation-circle': type === 'error',
                  'text-yellow-400 fas fa-exclamation-triangle': type === 'warning',
                  'text-blue-400 fas fa-info-circle': type === 'info'
                }
              ]"
            ></i>
          </div>
          <div class="ml-3 w-0 flex-1 pt-0.5">
            <p class="text-sm font-medium text-gray-900">
              {{ message }}
            </p>
          </div>
          <div class="ml-4 flex flex-shrink-0">
            <button
              type="button"
              class="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              @click="close"
            >
              <span class="sr-only">Close</span>
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const message = ref('')
const type = ref<'success' | 'error' | 'warning' | 'info'>('info')
let timeout: number | null = null

// Watch for changes in the auth store's message
watch(
  () => auth.message,
  (newMessage) => {
    if (newMessage) {
      showMessage(newMessage, 'info')
    }
  }
)

const showMessage = (msg: string, msgType: 'success' | 'error' | 'warning' | 'info' = 'info') => {
  message.value = msg
  type.value = msgType

  // Clear any existing timeout
  if (timeout) {
    clearTimeout(timeout)
  }

  // Set new timeout
  timeout = window.setTimeout(() => {
    close()
  }, 5000) // Hide after 5 seconds
}

const close = () => {
  message.value = ''
  auth.setMessage('')
  if (timeout) {
    clearTimeout(timeout)
    timeout = null
  }
}
</script>

<style scoped>
/* No additional styles needed as we're using Tailwind classes */
</style> 