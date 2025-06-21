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
    
    <!-- Image Upload Modal -->
    <div v-if="showImageUpload" class="image-upload-modal">
      <div class="modal-overlay" @click="closeImageUpload"></div>
      <div class="modal-content">
        <div class="modal-header">
          <h3>Upload Image for {{ side === 'front' ? 'Front' : 'Back' }}</h3>
          <button @click="closeImageUpload" class="close-button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <ImageUploader
            ref="imageUploaderRef"
            :title="`Upload ${side === 'front' ? 'Front' : 'Back'} Image`"
            :label="`Upload ${side === 'front' ? 'Front' : 'Back'} Image`"
            :show-label="true"
            :smart-compression="true"
            :target-size="500 * 1024"
            @file-selected="handleFileSelected"
            @remove="handleImageRemove"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Card, CardSide, CardLayout, ContentCell } from '@/types/card'
import CardContentLayout from './CardContent/CardContentLayout.vue'
import ImageUploader from './ImageUploader.vue'
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

// Image upload state
const showImageUpload = ref(false)
const imageUploaderRef = ref<InstanceType<typeof ImageUploader> | null>(null)
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
  showImageUpload.value = true
}

const closeImageUpload = () => {
  showImageUpload.value = false
  // Do NOT reset the uploader's state here. The modal is just closing.
  // The uploader's state will be reset when the parent component (e.g., SetWizard)
  // is destroyed or decides to clear the card content.
}

const handleFileSelected = (file: File) => {
  // The file received from the uploader is already compressed.
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
  closeImageUpload()
}

const handleImageRemove = () => {
  // This is now handled by the remove event from the uploader
  // We may need to find the cell with the image and remove it.
  // For now, this is sufficient to reset the uploader's state.
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
  
  if (imageUploaderRef.value) {
    imageUploaderRef.value.removeImage()
  }
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

/* Image Upload Modal */
.image-upload-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-content {
  position: relative;
  background: white;
  border-radius: var(--radius-lg);
  padding: 0;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text);
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--color-text-secondary);
  padding: 0.5rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.close-button:hover {
  background: var(--color-background-alt);
  color: var(--color-text);
}

.modal-body {
  padding: 1.5rem;
}

/* Mobile styles */
@media (max-width: 600px) {
  .card-controls {
    flex-wrap: wrap;
  }
  
  .control-button {
    flex: 1 1 calc(50% - var(--space-sm));
  }
  
  .modal-content {
    width: 95%;
    margin: 1rem;
  }
}
</style> 