<template>
  <div class="card-content-cell">
    <template v-if="isEditing">
      <!-- Show both if both are set -->
      <template v-if="content && mediaUrl">
        <div class="text-content half-height" :style="computedStyle" contenteditable="true" ref="contentRef" :data-placeholder="side === 'front' ? 'Front side' : 'Back side'" @input="handleInput" @blur="handleBlur" @focus="handleFocus" @paste="handlePaste" @click="handleClick" @keydown="handleKeyDown"></div>
        <div class="media-container half-height">
          <img :src="mediaUrl" alt="Card image" style="width: 100%; height: 100%; object-fit: contain;" />
          <button class="media-close" @click="handleMediaRemove" aria-label="Remove media">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <template v-for="embed in embeddedMedia" :key="embed.url">
          <MediaEmbed :url="embed.type === 'youtube' ? embed.embedUrl : embed.url" :type="embed.type" @remove="handleEmbedRemove(embed.url)" />
        </template>
      </template>
      <!-- Only content -->
      <template v-else-if="content">
        <div class="text-content full-height" :style="computedStyle" contenteditable="true" ref="contentRef" :data-placeholder="side === 'front' ? 'Front side' : 'Back side'" @input="handleInput" @blur="handleBlur" @focus="handleFocus" @paste="handlePaste" @click="handleClick" @keydown="handleKeyDown"></div>
        <template v-for="embed in embeddedMedia" :key="embed.url">
          <MediaEmbed :url="embed.type === 'youtube' ? embed.embedUrl : embed.url" :type="embed.type" @remove="handleEmbedRemove(embed.url)" />
        </template>
      </template>
      <!-- Only mediaUrl -->
      <div v-else-if="mediaUrl" class="media-container full-height">
        <img :src="mediaUrl" alt="Card image" style="width: 100%; height: 100%; object-fit: contain;" />
        <button class="media-close" @click="handleMediaRemove" aria-label="Remove media">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <!-- Neither: just show contenteditable -->
      <div v-else class="text-content full-height" :style="computedStyle" contenteditable="true" ref="contentRef" :data-placeholder="side === 'front' ? 'Front side' : 'Back side'" @input="handleInput" @blur="handleBlur" @focus="handleFocus" @paste="handlePaste" @click="handleClick" @keydown="handleKeyDown"></div>
    </template>
    <template v-else>
      <!-- Show both if both are set -->
      <template v-if="content && mediaUrl">
        <div class="text-content half-height" :style="computedStyle" v-html="viewModeContent"></div>
        <div class="media-container half-height">
          <img :src="mediaUrl" alt="Card image" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
      </template>
      <!-- Only content -->
      <div v-else-if="content" class="text-content full-height" :style="computedStyle" v-html="viewModeContent"></div>
      <!-- Only mediaUrl -->
      <div v-else-if="mediaUrl" class="media-container full-height">
        <img :src="mediaUrl" alt="Card image" style="width: 100%; height: 100%; object-fit: contain;" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useMediaUtils } from '@/composables/useMediaUtils'
import { useDynamicFontSize } from '@/composables/useDynamicFontSize'
import MediaEmbed from './MediaEmbed.vue'

const props = withDefaults(defineProps<{
  content: string
  mediaUrl: string | null
  isEditing: boolean
  side: 'front' | 'back'
  showMediaControls?: boolean
}>(), {
  showMediaControls: false
})

const emit = defineEmits(['update'])

const contentRef = ref<HTMLElement | null>(null)
const containerSize = ref({ width: 0, height: 0 })

const { detectAndRenderMedia, detectMediaType } = useMediaUtils()
const { getTextStyle } = useDynamicFontSize()

const computedStyle = computed(() => {
  const text = props.isEditing ? (contentRef.value ? contentRef.value.innerText : props.content || '') : props.content || ''
  const fontSize = getTextStyle(text, {
    width: containerSize.value.width,
    height: containerSize.value.height
  }).fontSize
  return { fontSize }
})

// --- Embedded Media Parsing ---
function extractEmbeddableMedia(content: string) {
  const urls = (content.match(/https?:\/\/[^\s<>"]+/g) || [])
  const embeds: { url: string, type: 'youtube' | 'image', embedUrl: string }[] = []
  for (const url of urls) {
    const media = detectMediaType(url)
    if (media.type === 'youtube' && media.embedUrl) {
      embeds.push({ url, type: 'youtube', embedUrl: media.embedUrl })
    } else if (media.type === 'image') {
      embeds.push({ url, type: 'image', embedUrl: url })
    }
  }
  return embeds
}

const embeddedMedia = computed(() => extractEmbeddableMedia(props.content))

const viewModeContent = computed(() => detectAndRenderMedia(props.content, false))

function handleInput() {
  if (!contentRef.value) return
  const raw = contentRef.value.innerText
  emit('update', { content: raw })
  measureAndSetContainerSize()
}

function handleMediaRemove(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  emit('update', { mediaUrl: null })
}

function handleEmbedRemove(url: string) {
  // Remove the URL from the content and emit
  const newContent = (props.content || '').replace(url, '').replace(/\s{2,}/g, ' ').trim()
  emit('update', { content: newContent })
}

function measureAndSetContainerSize() {
  nextTick(() => {
    if (contentRef.value && contentRef.value.offsetParent !== null) {
      const rect = contentRef.value.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        containerSize.value = { width: rect.width, height: rect.height }
      }
    }
  })
}

onMounted(() => {
  if (props.isEditing && contentRef.value && contentRef.value.innerText !== props.content) {
    contentRef.value.innerText = props.content || ''
  }
  measureAndSetContainerSize()
})

watch(() => props.mediaUrl, () => {
  if (props.isEditing && contentRef.value) {
    nextTick(() => {
      if (contentRef.value && contentRef.value.innerText !== props.content) {
        contentRef.value.innerText = props.content || ''
      }
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

function handleResize() {
  if (!props.isEditing) {
    // If you use resizeKey or similar, update here
  }
}

const handleClick = (event: MouseEvent) => {
  if (props.isEditing && contentRef.value) {
    event.stopPropagation()
    if (document.activeElement !== contentRef.value) {
      contentRef.value.focus()
    }
  }
}

const handleFocus = () => {
  if (contentRef.value && props.isEditing) {
    if (document.activeElement !== contentRef.value) {
      contentRef.value.focus()
    }
  }
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
  nextTick(() => {
    handleInput()
  })
}

function handleBlur() {
  // No longer need to emit here, as we emit on every input
}

function handleKeyDown(event: KeyboardEvent) {
  if (!contentRef.value) return
  // Only trigger if both text and media are visible
  if (props.content && props.mediaUrl) {
    const isBackspaceOrDelete = event.key === 'Backspace' || event.key === 'Delete'
    // If the text is empty after the key event, hide the text area
    if (isBackspaceOrDelete) {
      // Use setTimeout to wait for the DOM update after the key event
      setTimeout(() => {
        const text = contentRef.value?.innerText || ''
        if (text.trim() === '') {
          emit('update', { content: '' })
        }
      }, 0)
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
  gap: 0;
  position: relative;
}

.text-content {
  width: 100%;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: text;
  line-height: 1.25;
  position: relative;
  border-radius: var(--radius-lg);  
  border: 1px solid transparent;
  min-height: 0;
  box-sizing: border-box;
}

.text-content.full-height {
  height: 100%;
  min-height: 100px;
}
.text-content.half-height {
  height: 50%;
  min-height: 50px;
}

.media-container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
  min-height: 0;
  box-sizing: border-box;
}

.media-container.full-height {
  height: 100%;
  min-height: 100px;
}
.media-container.half-height {
  height: 50%;
  min-height: 50px;
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

.live-preview {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  z-index: 2;
}
</style> 