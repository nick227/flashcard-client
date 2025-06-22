<template>
  <div class="card-content" :class="{ 'is-editing': isEditing }">
    <CardContentLayout
      :layout="cardState[side].layout"
      :side="side"
      :cells="cardState[side].cells"
      :is-mobile="isMobile"
      :is-editing="isEditing"
      @update="handleCellUpdate"
      @remove="handleCellRemove"
    />
    <div v-if="isEditing" class="card-controls">
      <button class="control-button" @click="onToggleLayout" title="Toggle Layout">
        <i class="fas fa-th-large"></i>
      </button>
      <button class="control-button" @click="handleAddImage" title="Add Image">
        <i class="fas fa-image"></i>
      </button>
      <button class="control-button" @click="handleAIGenerate" :disabled="aiLoading" title="Generate with AI">
        <i class="fas fa-magic"></i>
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
import type { Card, CardSide, CardLayout, ContentCell } from '@/types/card'
import CardContentLayout from './CardContent/CardContentLayout.vue'
import { useCardContentState } from './CardContent/CardContentState'
import { useCardContentAI } from './CardContent/CardContentAI'
import { useToaster } from '@/composables/useToaster'
import { ref, nextTick, onUnmounted } from 'vue'

const props = defineProps<{
  card: Card
  side: CardSide
  isEditing?: boolean
  isMobile?: boolean
  title?: string
  description?: string
  category?: string
  onImageFile?: (data: { file: File, side: CardSide, cellIndex: number }) => void
}>()

const emit = defineEmits<{
  (e: 'update', card: Card): void
  (e: 'edit-start'): void
  (e: 'edit-end'): void
  (e: 'image-file', data: { file: File, side: CardSide, cellIndex: number }): void
}>()

const { toast } = useToaster()
const { cardState, currentSide, updateLayout, addCell, updateCell, removeCell } = useCardContentState(props)

// File input reference
const fileInputRef = ref<HTMLInputElement | null>(null)
const blobUrls = ref<Set<string>>(new Set()) // Track all blob URLs for cleanup

const handleCellUpdate = (index: number, updates: Partial<ContentCell>) => {
  updateCell(currentSide.value, index, updates)
  emit('update', cardState.value)
}

const handleCellRemove = (index: number) => {
  removeCell(currentSide.value, index)
  emit('update', cardState.value)
}

const handleAddImage = () => {
  // Directly trigger file input
  fileInputRef.value?.click()
}

const handleFileSelected = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return
  
  // Reset the input so the same file can be selected again
  target.value = ''
  
  // Create blob URL for preview
  const blobUrl = URL.createObjectURL(file)
  blobUrls.value.add(blobUrl) // Track for cleanup

  const cells = cardState.value[currentSide.value].cells || []
  
  // Find the first empty text cell to replace
  const emptyCellIndex = cells.findIndex(cell => cell.type === 'text' && !cell.content?.trim())

  let targetCellIndex = -1

  if (emptyCellIndex !== -1) {
    // If an empty cell is found, update it
    targetCellIndex = emptyCellIndex
    updateCell(currentSide.value, targetCellIndex, { type: 'media', mediaUrl: blobUrl, content: '' })
  } else {
    // If no empty cells, add a new one and get its index
    addCell(currentSide.value, 'media', true)
    // Get the updated cells array to find the new cell index
    const updatedCells = cardState.value[currentSide.value].cells || []
    targetCellIndex = updatedCells.length - 1
    updateCell(currentSide.value, targetCellIndex, { mediaUrl: blobUrl })
  }

  if (targetCellIndex !== -1) {
    // Emit file data to parent for later upload
    emit('image-file', {
      file: file,
      side: props.side,
      cellIndex: targetCellIndex
    })
    
    if (props.onImageFile) {
      props.onImageFile({
        file: file,
        side: props.side,
        cellIndex: targetCellIndex
      })
    }
  }
  
  emit('update', cardState.value)
}

const onToggleLayout = () => {
  const side = currentSide.value
  const currentLayout = cardState.value[side].layout
  const layouts: CardLayout[] = ['default', 'two-col', 'two-row']
  const currentIndex = layouts.indexOf(currentLayout)
  const nextLayout = layouts[(currentIndex + 1) % layouts.length]
  
  updateLayout(side, nextLayout)
  emit('update', cardState.value)
  
  // Wait for next tick to ensure layout has updated
  nextTick(() => {
    // Trigger resize event to force container size recalculation
    window.dispatchEvent(new Event('resize'))
  })
}

// Initialize AI with proper callbacks
const { aiLoading, aiGenerate } = useCardContentAI(
  (message: string) => toast(message, 'info'),
  (text: string) => {
    // Handle AI generation result - add as new text cell (force to bypass layout limits)
    addCell(currentSide.value, 'text', true)
    // Update the last cell with the generated content
    const cells = cardState.value[currentSide.value].cells || []
    if (cells.length > 0) {
      updateCell(currentSide.value, cells.length - 1, { content: text })
    }
    emit('update', cardState.value)
  },
  (error: string) => toast(error, 'error')
)

// Update the AI generate button click handler
const handleAIGenerate = () => {
  // Validate required form data
  if (!props.title?.trim()) {
    toast('Please fill in the set title first', 'info')
    return
  }
  
  if (!props.description?.trim()) {
    toast('Please fill in the set description first', 'info')
    return
  }
  
  if (!props.category?.trim()) {
    toast('Please select a category first', 'info')
    return
  }

  // Get content from the other side for context
  const otherSide = props.side === 'front' ? 'back' : 'front'
  const otherSideContent = cardState.value[otherSide].cells
    ?.map(cell => cell.content)
    .filter(Boolean)
    .join('\n') || ''

  aiGenerate(
    props.side,
    props.title.trim(),
    props.description.trim(),
    props.category.trim(),
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
  display: flex;
  flex-direction: column;
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
}

.control-button:hover {
  border-color: var(--color-primary);
}

.control-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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