<template>
  <div class="card-content" :class="{ 'is-editing': isEditing }">
    <CardContentLayout
      ref="layoutRef"
      :layout="cardState[side].layout"
      :side="side"
      :content="cardState[side].content"
      :mediaUrl="cardState[side].mediaUrl"
      :is-mobile="isMobile"
      :is-editing="isEditing"
      :is-flipped="isFlipped"
      :card-id="cardState.id"
      @update="handleContentUpdate"
    />
    <div v-if="isEditing" class="card-controls">
      <button class="control-button" @click="handleAddImage" title="Add Image">
        <i class="fas fa-image"></i>
      </button>
      <button class="control-button" @click="handleAIGenerate" :disabled="aiLoading" title="Generate with AI">
        <i class="fas fa-magic"></i>
        <span v-if="aiLoading" class="loading-text">Generating...</span>
      </button>
    </div>
    
    <!-- Hidden file input for direct image upload -->
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="display: none"
      @change="handleFileSelected"
    />
  </div>
</template>

<script setup lang="ts">
import type { Card, CardSide } from '@/types/card'
import CardContentLayout from './CardContent/CardContentLayout.vue'
import { useCardContentAI } from './CardContent/CardContentAI'
import { useToaster } from '@/composables/useToaster'
import { ref, onUnmounted, watch } from 'vue'
import { useImageCompression } from '@/composables/useImageCompression'

const props = defineProps<{
  card: Card
  side: CardSide
  isEditing?: boolean
  isMobile?: boolean
  title?: string
  description?: string
  category?: string
  onImageFile?: (data: { file: File, side: CardSide }) => void
  isFlipped?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', card: Card): void
  (e: 'edit-start'): void
  (e: 'edit-end'): void
  (e: 'image-file', data: { file: File, side: CardSide }): void
}>()

const { toast } = useToaster()
const cardState = ref({ ...props.card })

// Sync cardState with props.card when it changes
watch(
  () => props.card,
  (newCard) => {
    cardState.value = { ...newCard }
  },
  { deep: true, immediate: true }
)

// File input reference
const fileInputRef = ref<HTMLInputElement | null>(null)
const blobUrls = ref<Set<string>>(new Set()) // Track all blob URLs for cleanup

const { compressImage } = useImageCompression()

const layoutRef = ref()
defineExpose({ layoutRef })

const handleContentUpdate = (updates: { front?: any; back?: any }) => {
  (['front', 'back'] as const).forEach((side) => {
    if (updates[side]) {
      Object.assign(cardState.value[side], updates[side])
    }
  })
  cardState.value = { ...cardState.value }
  emit('update', { ...cardState.value })
}

const handleAddImage = () => {
  fileInputRef.value?.click()
}

const handleFileSelected = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    console.warn('[handleFileSelected] No file selected')
    return
  }

  // Reset the input so the same file can be selected again
  target.value = ''

  // Compress the image before preview/storage
  let compressedFile = file
  try {
    const result = await compressImage(file)
    compressedFile = result.file
  } catch (err) {
    toast('Image compression failed. Using original file.', 'error')
    console.warn('[handleFileSelected] Compression failed, using original file')
  }

  // Create blob URL for preview
  const blobUrl = URL.createObjectURL(compressedFile)

  // Clean up previous blob URL for this side
  const prevUrl = cardState.value[props.side].mediaUrl
  if (prevUrl && prevUrl.startsWith('blob:')) {
    URL.revokeObjectURL(prevUrl)
  }
  cardState.value[props.side].mediaUrl = blobUrl

  // Convert compressed file to base64 and emit/store for localStorage
  const reader = new FileReader()
  reader.onload = () => {
    emit('image-file', {
      file: compressedFile,
      side: props.side
    })
  }
  reader.readAsDataURL(compressedFile)
}

// Initialize AI with proper callbacks
const { aiLoading, aiGenerate } = useCardContentAI(
  (message: string) => {
    toast(message, 'info')
  },
  (text: string) => {
    
    // Validate AI response
    if (!text || typeof text !== 'string') {
      toast('Invalid AI response received', 'error')
      return
    }
    
    if (text.trim().length === 0) {
      console.warn('[CardContent] Empty AI response received')
      toast('AI generated empty content', 'info')
      return
    }
    
    try {
      // Replace all existing cells with the new AI-generated content
      cardState.value[props.side].content = text.trim()
      
      // Set layout to 'default' for text-only content
      // Update layout directly without normalizing cells again
      const currentLayout = cardState.value[props.side].layout
      if (currentLayout !== 'default') {
        cardState.value[props.side].layout = 'default'
      }
      
      emit('update', cardState.value)
    } catch (error) {
      toast('Failed to update card with AI content', 'error')
    }
  },
  (error: string) => {
    toast(error, 'error')
  }
)

// Update the AI generate button click handler
const handleAIGenerate = () => {
  
  // Validate required form data with better error messages
  const title = props.title?.trim()
  const description = props.description?.trim()
  const category = props.category?.trim()
  
  if (!title) {
    console.warn('[CardContent] Missing title')
    toast('Please fill in the set title first', 'info')
    return
  }
  
  if (!description) {
    console.warn('[CardContent] Missing description')
    toast('Please fill in the set description first', 'info')
    return
  }
  
  if (!category) {
    console.warn('[CardContent] Missing category')
    toast('Please select a category first', 'info')
    return
  }
  
  // Validate minimum content requirements
  if (title.length < 3) {
    toast('Title must be at least 3 characters long', 'info')
    return
  }
  
  if (description.length < 10) {
    toast('Description must be at least 10 characters long', 'info')
    return
  }

  // Get content from the other side for context
  const otherSide = props.side === 'front' ? 'back' : 'front'
  const otherSideContent = cardState.value[otherSide].content || ''

  aiGenerate(
    props.side,
    title,
    description,
    category,
    otherSideContent
  )
}

// Cleanup blob URLs when component is unmounted
onUnmounted(() => {
  // Revoke all tracked blob URLs to prevent memory leaks
  blobUrls.value.forEach(url => {
    URL.revokeObjectURL(url)
  })
  blobUrls.value.clear()
})
</script>

<style scoped>
.card-content {
  width: 100%;
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.card-controls {
  display: flex;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--color-background-alt);
  border-radius: var(--radius-md);
  width: 100%;
  box-sizing: border-box;
}

.control-button {
  padding: var(--space-sm);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-duration) var(--transition-timing);
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  position: relative;
}

.control-button:hover {
  border-color: var(--color-primary);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.layout-indicator {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-muted);
  background: var(--color-background);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.loading-text {
  font-size: 0.75rem;
  color: var(--color-primary);
  font-weight: 500;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* Mobile styles */
@media (max-width: 600px) {
  .card-controls {
    flex-wrap: wrap;
  }
  
  .control-button {
    flex: 1 1 calc(50% - var(--space-sm));
  }
}
</style> 