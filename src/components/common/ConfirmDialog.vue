<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 scale-95"
    enter-to-class="opacity-100 scale-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 scale-100"
    leave-to-class="opacity-0 scale-95"
  >
    <div 
      v-if="modelValue" 
      class="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
      @click.self="$emit('update:modelValue', false)"
    >
      <div 
        class="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <div class="text-center mb-6">
          <div class="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center transform transition-transform hover:scale-105">
            <i class="fa-solid fa-triangle-exclamation text-red-500 text-2xl"></i>
          </div>
          <h3 id="dialog-title" class="text-xl font-semibold text-gray-900 mb-2">{{ title }}</h3>
          <p id="dialog-description" class="text-gray-600 leading-relaxed">{{ text }}</p>
        </div>
        <div class="flex justify-center gap-4">
          <button 
            ref="cancelButton"
            class="button button-danger"
            :class="{ 'ring-2 ring-offset-2 ring-gray-300': focusedButton === 'cancel' }"
            @click="$emit('update:modelValue', false)"
          >
            Cancel
          </button>
          <button 
            ref="confirmButton"
            class="button button-info"
            :class="{ 'ring-2 ring-offset-2 ring-blue-300': focusedButton === 'confirm' }"
            @click="confirm"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title: string
  text: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
}>()

const cancelButton = ref<HTMLButtonElement | null>(null)
const confirmButton = ref<HTMLButtonElement | null>(null)
const focusedButton = ref<'cancel' | 'confirm'>('confirm')

const confirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

// Handle keyboard events
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.modelValue) return
  
  if (e.key === 'Escape') {
    emit('update:modelValue', false)
  } else if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault()
    if (focusedButton.value === 'confirm') {
      confirm()
    } else {
      emit('update:modelValue', false)
    }
  } else if (e.key === 'ArrowLeft') {
    e.preventDefault()
    focusedButton.value = 'cancel'
    cancelButton.value?.focus()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    focusedButton.value = 'confirm'
    confirmButton.value?.focus()
  }
}

// Focus management
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Focus confirm button when dialog opens
    setTimeout(() => {
      focusedButton.value = 'confirm'
      confirmButton.value?.focus()
    }, 100)
  }
})

// Update focused button when focus changes
const handleFocusChange = (e: FocusEvent) => {
  if (e.target === cancelButton.value) {
    focusedButton.value = 'cancel'
  } else if (e.target === confirmButton.value) {
    focusedButton.value = 'confirm'
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  cancelButton.value?.addEventListener('focus', handleFocusChange)
  confirmButton.value?.addEventListener('focus', handleFocusChange)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  cancelButton.value?.removeEventListener('focus', handleFocusChange)
  confirmButton.value?.removeEventListener('focus', handleFocusChange)
})
</script>

<style scoped>
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Add a subtle pulse animation to the warning icon */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.fa-triangle-exclamation {
  animation: pulse 2s infinite;
}

/* Add a subtle hover effect to the dialog */
.bg-white {
  transition: transform 0.2s ease;
}

.bg-white:hover {
  transform: translateY(-2px);
}
</style> 