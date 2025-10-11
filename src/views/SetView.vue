<template>
  <div class="container-main mx-auto px-4 py-2 set-view">
    <Suspense>
      <template #default>
        <FlashCardViewer :set-id="setId" />
      </template>
      <template #fallback>
        <div class="loading-container">
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <p class="loading-text">{{ loadingMessage }}</p>
          </div>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

const FlashCardViewer = defineAsyncComponent(() => 
  import('@/components/study/FlashCardViewer.vue')
)

const route = useRoute()
const setId = computed(() => {
  const id = Number(route.params.setId)
  return id
})

const loadingMessages = ['Drawing flashcards...', 'Just a sec...', 'Hold on tight...', 'Loading...', 'Hang on flashcards...', 'Prepping flashcards...', 'Loading magic...', 'Mixing it up...', 'Processing...', 'Counting flashcards...']
const loadingMessage = computed(() => loadingMessages[Math.floor(Math.random() * loadingMessages.length)])
</script>

<style scoped>
.loading-container {
  width: 100%;
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: white;
  animation: fadeOut 1s ease-in-out;
}

@keyframes fadeOut {
  from { opacity: 1; }
  to { opacity: 0; }
}


.loading-content {
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 1rem;
  border: 3px solid #e5e7eb;
  border-top-color: #000;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  color: #000;
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
}
</style> 