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
      <div v-if="isEditing"
        class="text-content"
        :style="computedStyle"
        contenteditable="true"
        ref="contentRef"
        :aria-label="'Editable text content'"
        :tabindex="0"
        @input="handleInput"
        @paste="handlePaste"
        @blur="handleBlur"
        @focus="handleFocus"
        @click="handleClick"
      ></div>
      <div v-else
        class="text-content"
        :style="computedStyle"
        :aria-label="'Text content'"
        tabindex="-1"
        v-html="viewModeContent"
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
import { useDynamicFontSize } from '@/composables/useDynamicFontSize'

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

const liveContent = ref(props.cell.content || '')

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
const { handleImageError } = useCardContent(reactiveCell, cardContentOptions)
const { 
  detectAndRenderMedia,
  detectMediaType,
  generateMediaHtml,
  isImageUrl
} = useMediaUtils()

const { getTextStyle } = useDynamicFontSize()

// Computed style for reactive updates
const computedStyle = computed(() => {
  if (!props.cell || props.cell.type !== 'text') {
    return { fontSize: '1rem' }
  }
  // Use liveContent for font size calculation in edit mode
  const text = props.isEditing ? liveContent.value : props.cell.content || ''
  const fontSize = getTextStyle(text, {
    width: containerSize.value.width,
    height: containerSize.value.height,
    cacheKey: cacheKey ? `${cacheKey}-${text}` : undefined
  }).fontSize
  return { fontSize }
})

// Computed for view mode processed content
const viewModeContent = computed(() => {
  return detectAndRenderMedia(props.cell.content, false)
})

function setContentEditableText(content: string) {
  if (contentRef.value) {
    contentRef.value.textContent = content || ''
    measureAndSetContainerSize()
  }
}

function handleInput() {
  if (!contentRef.value) return
  liveContent.value = contentRef.value.innerText
  measureAndSetContainerSize()
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
  // After paste, handle input as usual
  nextTick(() => handleInput())
}

function handleBlur() {
  if (!contentRef.value) return
  const raw = contentRef.value.innerText
  if (props.index !== undefined) {
    emit('update', props.index, { content: raw })
  }
  // Optionally, you could trigger a preview/render of embeds here
  // For now, just keep the text as is; view mode will show embeds
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
onMounted(() => {
  if (props.isEditing && props.cell.type === 'text') {
    liveContent.value = props.cell.content || ''
    setContentEditableText(liveContent.value)
  }
  measureAndSetContainerSize()
})

// Watch for changes in editing mode
watch(() => props.isEditing, (isEditing) => {
  if (isEditing && props.cell.type === 'text') {
    liveContent.value = props.cell.content || ''
    setContentEditableText(liveContent.value)
  }
})

// Watch for changes in cell content - ONLY when NOT editing
watch(() => props.cell.content, (newContent, oldContent) => {
  if (!props.isEditing && newContent !== oldContent) {
    liveContent.value = newContent || ''
    setContentEditableText(liveContent.value)
  }
}, { flush: 'post' })

// Watch for changes in container size
watch(() => reactiveContainerSize.value, () => {
  // Handle size changes if needed
})

// Watch for changes in cell prop
watch(() => props.cell, () => {
}, { immediate: true, deep: true })

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  cleanupEventListeners()
  window.removeEventListener('resize', handleResize)
  // Delete all cache keys used by this component
  usedCacheKeys.forEach(deleteFontSizeCacheKey)
})

// Refactor enterEditMode to always set content after mount or when cell.content changes in edit mode
const setEditContent = async () => {
  await nextTick()
  const element = contentRef.value
  if (element) {
    try {
      if (props.cell.content && props.cell.content.trim()) {
        const processedContent = detectAndRenderMedia(props.cell.content, true)
        element.innerHTML = processedContent
      } else {
        element.textContent = ''
      }
    } catch (error) {
      element.textContent = props.cell.content || ''
    }
    measureAndSetContainerSize()
  }
}

// Watch for changes in edit mode or content
watch([
  () => props.isEditing,
  () => props.cell.content
], ([isEditing]) => {
  if (props.cell.type === 'text' && isEditing) {
    setEditContent()
  }
})

const { 
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
  overflow-y: auto;
  overflow-x: hidden;
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