<template>
  <div class="w-full">
    <!-- Controls -->
    <div class="controls-group mb-8 w-full bg-gray-50 rounded-xl py-8 px-6 border border-gray-200 shadow-sm">
      <button class="button flex-1 min-w-[120px] py-4 mr-auto" :class="{ 'button-disabled': isPrevDisabled }"
        :disabled="isPrevDisabled" @click="$emit('prev')" aria-label="Previous card">
        Prev
      </button>
      <button class="button flex-1 min-w-[120px] py-4 ml-auto" :class="{ 'button-disabled': isNextDisabled }"
        :disabled="isNextDisabled" @click="$emit('next')" aria-label="Next card">
        Next
      </button>
    </div>
    <!-- Progress Bar -->
    <div class="w-full flex flex-col items-center mb-4">
      <div class="progress-bar-bg w-full h-2 rounded-full bg-gray-200 overflow-hidden mt-6 mb-2"
        :title="`Progress: ${progressPercent.toFixed(0)}%`">
        <div class="progress-bar-fill h-2 rounded-full transition-all duration-300"
          :class="currentIndex === totalCards - 1 ? 'bg-green-500' : 'bg-blue-500'"
          :style="{ width: progressPercent + '%' }" :aria-label="`Progress: ${progressPercent.toFixed(0)}%`"></div>
      </div>
      <div class="flex items-center w-full flex justify-end">
        <span class="text-black-400">card {{ currentIndex + 1 }} of {{ totalCards }}</span>
    <button 
      v-if="showExit" 
      class="exit-fullscreen-button ml-4"
      @click.stop="exitFullscreen"
    >
      Exit Fullscreen
    </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'

const props = defineProps<{
  currentIndex: number
  totalCards: number
  isPrevDisabled: boolean
  isNextDisabled: boolean
  progressPercent: number
  showExit?: boolean
  mode: 'view' | 'edit' | 'preview'
}>()

// Debug prop changes
watch(() => props.showExit, (newVal) => {
  console.log('showExit changed:', newVal)
}, { immediate: true })

const exitFullscreen = () => {
  document.exitFullscreen()
}

// Debug mounted state
onMounted(() => {
  console.log('CardControls mounted:', { 
    mode: props.mode,
    isFullscreen: document.fullscreenElement !== null 
  })
})

defineEmits<{
  (e: 'prev'): void
  (e: 'next'): void
}>()
</script>

<style scoped>
</style> 