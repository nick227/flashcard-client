<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <div class="text-center">
        <div class="text-green-500 text-6xl mb-4">
          <i class="fas fa-check-circle"></i>
        </div>
        <h1 class="text-3xl font-bold mb-4">Purchase Successful!</h1>
        <p class="text-gray-600 mb-8">Thank you for your purchase. You now have access to the set.</p>
        <div class="flex justify-center gap-4">
          <button @click="router.push(`/sets/${setId}`)" 
            class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">
            Start Studying
          </button>
          <button @click="router.push('/browse')" 
            class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors">
            Browse More Sets
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToaster } from '@/composables/useToaster'

const route = useRoute()
const router = useRouter()
const { toast } = useToaster()

const setId = route.query.set_id || route.query.setId

onMounted(() => {
  if (!setId) {
    toast('Invalid purchase session', 'error')
    router.push('/browse')
  }
})
</script> 