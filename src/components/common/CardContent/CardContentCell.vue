<template>
  <div 
    class="card-content-cell" 
    :class="{ 'is-editing': isEditing }" 
    ref="containerRef"
    role="region"
    :aria-label="cell.type === 'text' ? 'Text content' : 'Media content'"
    :key="resizeKey"
  >
    <template v-if="cell.type === 'text'">
      <div 
        ref="contentRef"
        class="text-content"
        :style="computedStyle"
        :contenteditable="isEditing"
        :aria-label="isEditing ? 'Editable text content' : 'Text content'"
        :tabindex="isEditing ? 0 : -1"
        @input="handleTextInput"
        @paste="handlePaste"
        @keydown="handleKeyDown"
        @blur="handleBlur"
        @focus="handleFocus"
        @click="handleClick"
      ></div>
    </template>
    <template v-else-if="cell.type === 'media'">
      <div 
        :key="`cell-${index}-media`"
        class="media-container"
        role="img"
        :aria-label="cell.mediaUrl ? 'Media content' : 'Empty media container'"
      >
        <img 
          v-if="cell.mediaUrl && isImageUrl(cell.mediaUrl)" 
          :src="cell.mediaUrl" 
          alt="Media content"
          loading="lazy"
          @error="handleImageError"
        />
        <div 
          v-else-if="cell.mediaUrl" 
          v-html="generateMediaHtml(detectMediaType(cell.mediaUrl), isEditing)"
        ></div>
        <button 
          v-if="showMediaControls"
          class="media-close" 
          @click="handleMediaClose"
          aria-label="Remove media"
        >
          <i class="fas fa-times"></i>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import type { ContentCell } from '@/types/card'
import { useCardContent } from '@/composables/useCardContent'
import { useCardContentEvents } from '@/composables/useCardContentEvents'
import { useMediaUtils } from '@/composables/useMediaUtils'
import { clearFontSizeCache, deleteFontSizeCacheKey } from '@/composables/useDynamicFontSize'

const props = withDefaults(defineProps<{
  cell: ContentCell
  index?: number
  isMobile?: boolean
  isEditing?: boolean
  showMediaControls?: boolean
  side?: string // 'front' or 'back'
  cardId?: number | string // Card ID
  layout?: string // Added for layout prop
}>(), {
  isMobile: false,
  showMediaControls: false
})

const emit = defineEmits<{
  (e: 'update', index: number, updates: Partial<ContentCell>): void
  (e: 'remove', index: number): void
}>()

const contentRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)
const containerSize = ref({ width: 0, height: 0 })
const resizeKey = ref(0)

// Track all cache keys used during this component's lifetime
const usedCacheKeys = new Set<string>()

// Make cell reactive
const reactiveCell = computed(() => props.cell)

// Make container size reactive
const reactiveContainerSize = computed(() => {
  const size = containerSize.value
  return size
})

// Create a stable cache key for font size based on card id and side
const cacheKey = props.cardId ? `card-${props.cardId}-${props.side || 'front'}` : undefined

// Create reactive options for useCardContent
const cardContentOptions = computed(() => {
  const size = reactiveContainerSize.value
  // Compose the full cache key including text content
  const text = props.cell && props.cell.type === 'text' ? props.cell.content || '' : ''
  const fullCacheKey = cacheKey ? `${cacheKey}-${text}` : undefined
  if (fullCacheKey) usedCacheKeys.add(fullCacheKey)
  return {
    width: size.width,
    height: size.height,
    cacheKey: fullCacheKey,
  }
})

// Initialize card content utilities
const { textStyle, handleImageError } = useCardContent(reactiveCell, cardContentOptions)
const { 
  detectAndRenderMedia,
  detectMediaType,
  generateMediaHtml,
  isImageUrl
} = useMediaUtils()

// Computed style for reactive updates
const computedStyle = computed(() => {
  if (!props.cell || props.cell.type !== 'text') {
    return { fontSize: '1rem' }
  }
  
  const fontSize = textStyle.value.fontSize
  
  return {
    fontSize
  }
})

// Handle text input
const handleTextInput = (event: Event) => {
  const target = event.target as HTMLElement
  const content = target.textContent || ''
  // Only emit on input, don't watch for reactive updates during editing
  if (props.index !== undefined) {
    emit('update', props.index, { content })
  }
}

// Handle click for both normal media and embedded media
const handleClick = (event: MouseEvent) => {
  if (props.isEditing && contentRef.value) {
    event.stopPropagation()
    contentRef.value.focus()
  }
}

// For media cells, emit remove event
const handleMediaClose = (event: MouseEvent) => {
  if (props.cell.type === 'media' && props.index !== undefined) {
    event.preventDefault()
    event.stopPropagation()
    emit('remove', props.index)
  }
}

// Handle focus to ensure contenteditable is working
const handleFocus = () => {
  if (contentRef.value && props.isEditing) {
    contentRef.value.focus()
  }
}

// Handle blur to sync with parent
const handleBlur = () => {
  if (contentRef.value && props.cell.type === 'text' && props.index !== undefined) {
    // Check if we have embeds in the content
    const hasEmbeds = contentRef.value.querySelector('.media-container, iframe, img')
    
    if (hasEmbeds) {
      // If we have embeds, extract the original URL from the embed
      const mediaContainer = contentRef.value.querySelector('.media-container')
      if (mediaContainer) {
        const mediaUrl = mediaContainer.getAttribute('data-media-url') || 
                        mediaContainer.querySelector('[data-media-url]')?.getAttribute('data-media-url')
        
        if (mediaUrl) {
          emit('update', props.index, { content: mediaUrl })
        } else {
          // Fallback: preserve the original content
        }
      }
    } else {
      // If no embeds, use textContent as normal
      const content = contentRef.value.textContent || ''
      emit('update', props.index, { content })
    }
  }
}

// Remove updateContainerSize and setTimeout logic
// Add a simple measurement function
const measureAndSetContainerSize = async () => {
  await nextTick()
  if (contentRef.value && contentRef.value.offsetParent !== null) {
    const rect = contentRef.value.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      containerSize.value = { width: rect.width, height: rect.height }
    }
  }
}

// Initial measurement
onMounted(measureAndSetContainerSize)

// Initialize event handlers
const { 
  /* handleMediaClose, */ 
  handlePaste, 
  handleKeyDown, 
  cleanupEventListeners 
} = useCardContentEvents(contentRef, {
  isEditable: computed(() => props.isEditing).value,
  showMediaControls: computed(() => props.isEditing || props.showMediaControls).value,
  index: props.index,
  onTextInput: (index, content) => {
    emit('update', index, { content })
  },
  onMediaClose: (index, content) => {
    emit('update', index, { content })
  }
})

// Watch for changes in editing mode
watch(() => props.isEditing, (isEditing) => {
  if (isEditing) {
    enterEditMode()
  } else {
    exitEditMode()
  }
})

// Watch for changes in cell content - ONLY when NOT editing
watch(() => props.cell.content, (newContent, oldContent) => {
  console.log('[watch] cell.content changed', { newContent, oldContent, isEditing: props.isEditing });
  if (!props.isEditing && newContent !== oldContent) {
    updateContent();
  }
}, { flush: 'post' })

// Watch for changes in container size
watch(() => reactiveContainerSize.value, () => {
  // Handle size changes if needed
})

onMounted(async () => {
  await nextTick();
  updateContent();
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cleanupEventListeners()
  window.removeEventListener('resize', handleResize)
  // Delete all cache keys used by this component
  usedCacheKeys.forEach(deleteFontSizeCacheKey)
})

// Pure JS mode switching functions
const enterEditMode = () => {
  const element = contentRef.value
  if (element) {
    try {
      // In edit mode, we want to show embeds for URLs but preserve raw data
      // Use detectAndRenderMedia to find and render URLs within the content
      if (props.cell.content && props.cell.content.trim()) {
        const processedContent = detectAndRenderMedia(props.cell.content, true)
        element.innerHTML = processedContent
      } else {
        // For empty content, just set empty text
        element.textContent = ''
      }
    } catch (error) {
      element.textContent = props.cell.content || ''
    }
  }
}

const exitEditMode = () => {
  const element = contentRef.value
  if (element) {
    try {
      // Process content through useMediaUtils for view mode
      const processedContent = detectAndRenderMedia(props.cell.content, false)
      // Restore with processed embeds
      element.innerHTML = processedContent
    } catch (error) {
      // Fallback to plain text if processing fails
      element.textContent = props.cell.content || ''
    }
  }
}

// Handle content changes from parent - ONLY when NOT editing
const updateContent = () => {
  if (props.isEditing) {
    console.log('[updateContent] Skipped because isEditing is true');
    return;
  }
  if (contentRef.value) {
    try {
      const processedContent = detectAndRenderMedia(props.cell.content, false);
      console.log('[updateContent] Setting innerHTML:', processedContent);
      contentRef.value.innerHTML = processedContent;
      // Log size before nextTick
      if (contentRef.value) {
        const rect = contentRef.value.getBoundingClientRect();
        console.log('[updateContent] Size before nextTick:', { width: rect.width, height: rect.height });
      }
      // Measure after content is set and after nextTick
      nextTick(() => {
        if (contentRef.value && contentRef.value.offsetParent !== null) {
          const rect = contentRef.value.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            containerSize.value = { width: rect.width, height: rect.height };
            console.log('[updateContent] Size after nextTick:', containerSize.value);
          }
          // Also log after a short delay to compare
          setTimeout(() => {
            if (contentRef.value) {
              const delayedRect = contentRef.value.getBoundingClientRect();
              console.log('[updateContent] Size after 100ms:', { width: delayedRect.width, height: delayedRect.height });
            }
          }, 3300);
        }
      });
    } catch (error) {
      contentRef.value.textContent = props.cell.content || '';
    }
  } else {
    console.log('[updateContent] contentRef.value is null');
  }
}

console.log('[CardContentCell] cell:', props.cell);

function handleResize() {
  clearFontSizeCache()
  // This will force a re-render of the card content cell
  resizeKey.value++
}
</script>

<style scoped>
.card-content-cell {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: visible;
  position: relative;
}

.text-content > div {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.text-content {
  width: 100%;
  height: 100%;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: text;
  line-height: 1.25;
  min-height: 100px;
  position: absolute;
  overflow: visible;
  border: 1px solid transparent;
}

.text-content[contenteditable="true"] {
  outline: none;
  border-radius: var(--radius-md);
  transition: border-color 0.2s ease;
  cursor: text;
}

.text-content[contenteditable="true"]:focus {
  border-radius: var(--radius-sm);
}

.media-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
}

.media-container img,
.media-container video,
.media-container iframe,
.media-container > div {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.media-container img.error {
  opacity: 0.5;
  filter: grayscale(100%);
}

.media-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: background-color 0.2s ease;
  z-index: 1;
}

.media-close:hover {
  background: rgba(0, 0, 0, 0.7);
}

.media-close i {
  font-size: 0.75rem;
}

/* Add styles for embedded media */
.youtube-embed {
  position: relative;
  width: 100%;
  height: 100%;
}

.youtube-embed iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.embedded-link {
  color: var(--color-primary);
  text-decoration: none;
  word-break: break-all;
}

.embedded-link:hover {
  text-decoration: underline;
}
</style> 