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
      <button class="control-button" @click="onToggleLayout" :title="`Current: ${cardState[currentSide].layout}. Click to cycle layouts`">
        <i class="fas fa-th-large"></i>
        <span class="layout-indicator">{{ cardState[currentSide].layout }}</span>
      </button>
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
const { cardState, currentSide, updateLayout, addCell, updateCell, removeCell, replaceCells } = useCardContentState(props)

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
  const cells = cardState.value[side].cells || []
  
  console.log(`[onToggleLayout] Starting toggle for ${side}:`, {
    currentLayout,
    cellCount: cells.length,
    cells: cells.map(c => ({ type: c.type, hasContent: c.type === 'text' ? !!c.content?.trim() : !!c.mediaUrl }))
  })
  
  // Get current content to make intelligent layout decisions
  const textCells = cells.filter(cell => cell.type === 'text' && cell.content?.trim())
  const mediaCells = cells.filter(cell => cell.type === 'media' && cell.mediaUrl)
  const hasText = textCells.length > 0
  const hasMedia = mediaCells.length > 0
  
  console.log(`[onToggleLayout] Content analysis:`, { hasText, hasMedia, textCount: textCells.length, mediaCount: mediaCells.length })
  
  // Define the layout cycle
  const layouts: CardLayout[] = ['default', 'two-row', 'two-col']
  const currentIndex = layouts.indexOf(currentLayout)
  
  // Get next layout in cycle
  let nextLayout = layouts[(currentIndex + 1) % layouts.length]
  
  console.log(`[onToggleLayout] Layout cycle:`, { currentIndex, nextLayout, currentLayout })
  
  // If we have both text and media, prefer two-row over two-col
  // But still allow cycling through all layouts
  if (hasText && hasMedia && nextLayout === 'two-col' && currentLayout === 'default') {
    // Skip two-col and go directly to two-row when we have both content types
    nextLayout = 'two-row'
    console.log(`[onToggleLayout] Smart shortcut: skipping two-col, going to two-row`)
  }
  
  console.log(`[onToggleLayout] Final layout choice:`, nextLayout)
  
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
  (message: string) => {
    console.log('[CardContent] AI Message:', message)
    toast(message, 'info')
  },
  (text: string) => {
    console.log('[CardContent] AI Generation Result:', text)
    
    // Validate AI response
    if (!text || typeof text !== 'string') {
      console.error('[CardContent] Invalid AI response:', text)
      toast('Invalid AI response received', 'error')
      return
    }
    
    if (text.trim().length === 0) {
      console.warn('[CardContent] Empty AI response received')
      toast('AI generated empty content', 'info')
      return
    }
    
    try {
      // Create a new text cell with the AI-generated content
      const newCell = { type: 'text' as const, content: text.trim() }
      
      // Replace all existing cells with the new AI-generated content
      replaceCells(currentSide.value, [newCell])
      
      // Set layout to 'default' for text-only content
      // Update layout directly without normalizing cells again
      const currentLayout = cardState.value[currentSide.value].layout
      if (currentLayout !== 'default') {
        console.log('[CardContent] Setting layout to default for AI content')
        cardState.value[currentSide.value].layout = 'default'
      }
      
      console.log('[CardContent] Successfully updated card with AI content')
      emit('update', cardState.value)
    } catch (error) {
      console.error('[CardContent] Error updating card with AI content:', error)
      toast('Failed to update card with AI content', 'error')
    }
  },
  (error: string) => {
    console.error('[CardContent] AI Generation Error:', error)
    toast(error, 'error')
  }
)

// Update the AI generate button click handler
const handleAIGenerate = () => {
  console.log('[CardContent] handleAIGenerate called')
  
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
  const otherSideContent = cardState.value[otherSide].cells
    ?.map(cell => cell.content)
    .filter(Boolean)
    .join('\n') || ''

  console.log('[CardContent] Starting AI generation:', {
    side: props.side,
    title,
    description,
    category,
    otherSideContent: otherSideContent || 'none',
    currentSideContent: cardState.value[props.side].cells?.map(c => c.content).filter(Boolean).join('\n') || 'none'
  })

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
  display: flex;
  flex-direction: column;
}

.front .card-content.is-editing:hover:deep(.card-content-cell) {
  outline: 1px solid var(--color-muted);
  border-radius: var(--radius-sm);
}

.back .card-content.is-editing:hover:deep(.card-content-cell) {
  outline: 1px solid var(--color-white);
  border-radius: var(--radius-sm);
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