<template>
  <button 
    class="button button-primary" 
    :disabled="disabled || loading" 
    @click="startAISetGeneration"
  >
    <span v-if="loading" class="flex items-center gap-2">
      <span class="loading-spinner"></span>
      Generating...
    </span>
    <span v-else>🪄 AI Generator</span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/api'
import { useToaster } from '@/composables/useToaster'
import { CardService } from '@/services/CardService'

const props = defineProps<{ 
  disabled: boolean,
  title: string,
  description: string 
}>()

const emit = defineEmits<{
  'add-set': [cards: Array<{ id: number, front: string, back: string, hint: string | null }>]
}>()

const loading = ref(false)
const { toast } = useToaster()

const validateInput = () => {
  if (!props.title || !props.description) {
    toast('Please provide a title and description for the AI to generate cards', 'error')
    return false
  }

  if (props.title.length < 3 || props.title.length > 100) {
    toast('Title must be between 3 and 100 characters', 'error')
    return false
  }

  if (props.description.length < 10 || props.description.length > 500) {
    toast('Description must be between 10 and 500 characters', 'error')
    return false
  }

  return true
}

const startAISetGeneration = async () => {
  if (!validateInput()) return

  loading.value = true
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout

  try {
    const response = await api.post('/ai/generate', {
      title: props.title.trim(),
      description: props.description.trim()
    }, {
      signal: controller.signal,
      timeout: 30000 // 30 second timeout
    })

    const { front, back } = response.data
    
    if (!Array.isArray(front) || !Array.isArray(back) || front.length !== back.length) {
      throw new Error('Invalid response format from AI generator')
    }

    if (front.length === 0) {
      throw new Error('No cards were generated')
    }

    // Sanitize and validate each card
    const sanitizedCards = front.map((frontText, index) => {
      const sanitizedFront = frontText.trim().replace(/[<>]/g, '') // Basic XSS prevention
      const sanitizedBack = back[index].trim().replace(/[<>]/g, '')
      
      if (!sanitizedFront || !sanitizedBack) {
        throw new Error('Invalid card content generated')
      }
      
      if (sanitizedFront.length > 100 || sanitizedBack.length > 200) {
        throw new Error('Generated card content exceeds length limits')
      }

      return {
        id: CardService.generateId(),
        front: sanitizedFront,
        back: sanitizedBack,
        hint: null,
        setId: 0
      }
    })

    if (sanitizedCards.length > 10) {
      sanitizedCards.length = 10 // Limit to 10 cards
    }

    emit('add-set', sanitizedCards)
    toast(`Successfully generated ${sanitizedCards.length} cards!`, 'success')
  } catch (error: any) {
    console.error('AI generation error:', error)
    if (error.name === 'AbortError') {
      toast('Request timed out. Please try again.', 'error')
    } else if (error.response?.status === 401) {
      toast('Please log in to use the AI generator', 'error')
    } else if (error.response?.status === 429) {
      toast('Too many requests. Please try again later.', 'error')
    } else if (error.response?.status === 413) {
      toast('Input is too long. Please shorten your title or description.', 'error')
    } else if (error.response?.status === 500) {
      toast('AI service error. Please try again later.', 'error')
    } else {
      toast(error.response?.data?.message || 'Failed to generate cards', 'error')
    }
  } finally {
    clearTimeout(timeoutId)
    loading.value = false
  }
}
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