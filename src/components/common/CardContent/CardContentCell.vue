<template>
  <div 
    class="card-content-cell" 
    :class="{ 'is-editing': isEditing }" 
    ref="containerRef"
    role="region"
    :aria-label="cell.type === 'text' ? 'Text content' : 'Media content'"
  >
    <template v-if="cell.type === 'text'">
      <div 
        :key="`cell-${index}-text`"
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

const props = withDefaults(defineProps<{
  cell: ContentCell
  index?: number
  isMobile?: boolean
  isEditing?: boolean
  showMediaControls?: boolean
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
const containerSize = ref({ width: 621, height: 317 })

// Make cell reactive
const reactiveCell = computed(() => props.cell)

// Make container size reactive
const reactiveContainerSize = computed(() => {
  const size = containerSize.value
  return size
})

// Create reactive options for useCardContent
const cardContentOptions = computed(() => {
  const size = reactiveContainerSize.value
  return {
    isMobile: props.isMobile,
    width: size.width,
    height: size.height
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
    return { fontSize: '1rem', lineHeight: '1.5' }
  }
  
  const size = reactiveContainerSize.value
  if (size.width === 0 || size.height === 0) {
    return { fontSize: '1rem', lineHeight: '1.5' }
  }
  
  // Use fixed font size for URLs
  const isUrl = props.cell.content.startsWith('http')
  const fontSize = isUrl ? '1rem' : textStyle.value.fontSize
  
  return {
    fontSize,
    lineHeight: '1.5',
    minHeight: props.isEditing ? '100px' : undefined,
    '--container-width': `${size.width}px`,
    '--container-height': `${size.height}px`
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

// Update container size when it changes
const updateContainerSize = () => {
  if (containerRef.value) {
    const newSize = {
      width: Math.max(containerRef.value.clientWidth, 621),
      height: Math.max(containerRef.value.clientHeight, 317)
    }
    containerSize.value = newSize
  }
}

// Initialize event handlers
const { 
  /* handleMediaClose, */ 
  handlePaste, 
  handleKeyDown, 
  setupEventListeners, 
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

// Initialize on mount
onMounted(() => {
  if (contentRef.value && props.cell.type === 'text') {
    // Mode-aware content initialization
    // The watcher for isEditing will handle subsequent mode changes.
    // This handles the initial state correctly.
    if (props.isEditing) {
      enterEditMode();
    } else {
      updateContent();
    }
    
    nextTick(() => {
      setupEventListeners()
    })
    
    // Set up ResizeObserver with debounce
    let resizeTimeout: number | null = null
    const resizeObserver = new ResizeObserver(() => {
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout)
      }
      resizeTimeout = window.setTimeout(() => {
        updateContainerSize()
      }, 100)
    })
    if (containerRef.value) {
      resizeObserver.observe(containerRef.value)
      // Set initial size immediately
      updateContainerSize()
    }
    onUnmounted(() => {
      if (resizeTimeout) {
        window.clearTimeout(resizeTimeout)
      }
      resizeObserver.disconnect()
    })
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
  // If editing, only update the DOM if the prop change is coming from an external
  // source (like AI generation), which we detect by checking if the new prop
  // value is different from the current DOM content.
  // This prevents cursor jumps during normal typing.
  if (props.isEditing) {
    if (contentRef.value && newContent !== contentRef.value.textContent) {
      enterEditMode(); // Use enterEditMode to set the new content
    }
    return;
  }
  
  // If not editing, and content changes, update the DOM.
  if (newContent !== oldContent) {
    updateContent();
  }
}, { flush: 'post' })

// Watch for changes in container size
watch(() => reactiveContainerSize.value, () => {
  // Handle size changes if needed
})

onUnmounted(() => {
  cleanupEventListeners()
})

// Pure JS mode switching functions
const enterEditMode = () => {
  console.log('🔍 enterEditMode called for cell:', props.cell)
  const element = contentRef.value
  if (element) {
    try {
      // In edit mode, we want to show embeds for URLs but preserve raw data
      // Use detectAndRenderMedia to find and render URLs within the content
      if (props.cell.content && props.cell.content.trim()) {
        console.log('🔍 Calling detectAndRenderMedia for edit mode with content:', props.cell.content)
        const processedContent = detectAndRenderMedia(props.cell.content, true)
        console.log('🔍 Processed content for edit mode:', processedContent)
        element.innerHTML = processedContent
      } else {
        // For empty content, just set empty text
        console.log('🔍 Empty content, setting empty text')
        element.textContent = ''
      }
    } catch (error) {
      console.error('❌ Error entering edit mode:', error)
      element.textContent = props.cell.content || ''
    }
  }
}

const exitEditMode = () => {
  console.log('🔍 exitEditMode called for cell:', props.cell)
  const element = contentRef.value
  if (element) {
    try {
      // Process content through useMediaUtils for view mode
      console.log('🔍 Calling detectAndRenderMedia for view mode with content:', props.cell.content)
      const processedContent = detectAndRenderMedia(props.cell.content, false)
      console.log('🔍 Processed content for view mode:', processedContent)
      // Restore with processed embeds
      element.innerHTML = processedContent
    } catch (error) {
      console.error('❌ Error exiting edit mode:', error)
      // Fallback to plain text if processing fails
      element.textContent = props.cell.content || ''
    }
  }
}

// Handle content changes from parent - ONLY when NOT editing
const updateContent = () => {
  console.log('🔍 updateContent called for cell:', props.cell)
  // Don't update if user is editing
  if (props.isEditing) {
    console.log('🔍 Skipping updateContent - user is editing')
    return
  }
  
  if (contentRef.value) {
    try {
      // Always use detectAndRenderMedia for view mode to ensure URLs are properly embedded
      console.log('🔍 Calling detectAndRenderMedia for content update with content:', props.cell.content)
      const processedContent = detectAndRenderMedia(props.cell.content, false)
      console.log('🔍 Processed content for update:', processedContent)
      contentRef.value.innerHTML = processedContent
      
    } catch (error) {
      console.error('❌ Error updating content:', error)
      // Fallback to plain text
      contentRef.value.textContent = props.cell.content || ''
    }
  }
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
  line-height: 1.5;
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
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-light);
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