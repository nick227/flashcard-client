<template>
  <button 
    class="button button-primary" 
    :disabled="disabled || loading" 
    @click="generateSet"
    :title="disabled ? 'Complete Title and Description to Use' : 'Generate cards using AI'"
  >
    <span v-if="loading" class="flex items-center gap-2">
      <span class="loading-spinner"></span>
      Generating...
    </span>
    <span v-else>🪄 AI Generator</span>
  </button>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue'
import { useToaster } from '@/composables/useToaster'
import type { Card } from '@/types/card'
import { aiSocketService } from '@/services/AISocketService'

const props = defineProps<{ 
  disabled: boolean,
  title: string,
  description: string 
}>()

const emit = defineEmits<{
  'add-set': [cards: Card[]]
  'update:generating': [generating: boolean]
}>()

const loading = ref(false)
const { toast } = useToaster()
const toastTimeouts = ref<number[]>([])
const generating = ref(false)
const generationId = ref<string | null>(null)

// Watch loading state and emit to parent
watch(loading, (newValue: boolean) => {
  emit('update:generating', newValue)
  if (!newValue) {
    // Clear any pending toast timeouts when generation completes
    toastTimeouts.value.forEach((timeout: number) => clearTimeout(timeout))
    toastTimeouts.value = []
  }
})

const generateSet = async () => {
  if (!props.title || !props.description) return
  
  loading.value = true
  generating.value = true
  emit('update:generating', true)
  
  try {
    const cards: Card[] = []
    
    const id = aiSocketService.startGeneration(
      props.title,
      props.description,
      {
        onCardGenerated: (card: Card) => {
          console.log('AISetGenerator received card:', {
            id: card.id,
            front: { text: card.front.text, imageUrl: card.front.imageUrl },
            back: { text: card.back.text, imageUrl: card.back.imageUrl },
            hint: card.hint
          })
          
          // Add the card to our array
          cards.push(card)
          
          // Emit the card directly
          console.log('AISetGenerator emitting card:', {
            id: card.id,
            front: { text: card.front.text, imageUrl: card.front.imageUrl },
            back: { text: card.back.text, imageUrl: card.back.imageUrl },
            hint: card.hint
          })
          emit('add-set', [card])
        },
        onComplete: () => {
          console.log('Generation complete, total cards:', cards.length)
          loading.value = false
          generating.value = false
          emit('update:generating', false)
          toast(`Successfully generated ${cards.length} cards!`, 'success')
        },
        onError: (error: string) => {
          console.error('Generation error:', error)
          toast(error, 'error')
          loading.value = false
          generating.value = false
          emit('update:generating', false)
        }
      }
    )
    generationId.value = id
  } catch (error) {
    console.error('Generation error:', error)
    toast('Failed to generate cards', 'error')
    loading.value = false
    generating.value = false
    emit('update:generating', false)
    generationId.value = null
  }
}

// Clean up socket connection when component is unmounted
onUnmounted(() => {
  if (generationId.value) {
    aiSocketService.disconnect()
  }
})
</script>

<style scoped>
.button {
  min-width: 120px;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #ffffff;
  border-bottom-color: transparent;
  border-radius: 50%;
  display: inline-block;
  animation: rotation 1s linear infinite;
}

@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style> 