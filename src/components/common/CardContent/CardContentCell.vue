<template>
  <div :class="['card-content-cell', { content: !!content, media: mediaUrl }]">
    <!-------------------- Editing ------------------>
    <template v-if="isEditing">
      <!-- If there is an embed, show only the embed(s) and hide the contenteditable -->
      <template v-if="embeddedMedia.length > 0">
        <div class="media-container full-height">
          <template v-for="embed in embeddedMedia" :key="embed.url">
            <MediaEmbed :url="embed.type === 'youtube' ? embed.embedUrl : embed.url" :type="embed.type" @remove="handleEmbedRemove(embed.url)" />
          </template>
        </div>
      </template>
      <!-- Show both if both are set (no embed, but both content and mediaUrl) -->
      <template v-else-if="content && mediaUrl">
        <div class="text-content half-height" @paste="handlePaste" ref="contentRef" contenteditable="true" :style="computedStyle" @input="handleInputLocal" @blur="onBlur" @focus="isFocused = true" @keydown="handleKeydown">{{ localContent }}</div>
        <div class="media-container half-height">
          <img :src="mediaUrl" alt="Card image" style="width: 100%; height: 100%; object-fit: contain;" />
          <button class="media-close" @click="handleMediaRemove" aria-label="Remove media">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </template>
      <!-- Only content -->
      <template v-else-if="content">
        <div class="text-content full-height" @paste="handlePaste" ref="contentRef" contenteditable="true" :style="computedStyle" @input="handleInputLocal" @blur="onBlur" @focus="isFocused = true">{{ localContent }}</div>
      </template>
      <!-- Only mediaUrl (no content): show only image, no text area -->
      <div v-else-if="mediaUrl" class="media-container full-height">
        <img :src="mediaUrl" alt="Card image" style="width: 100%; height: 100%; object-fit: contain;" />
        <button class="media-close" @click="handleMediaRemove" aria-label="Remove media">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <!-- Neither: just show contenteditable -->
      <div v-else class="text-content full-height" @paste="handlePaste" ref="contentRef" contenteditable="true" :style="computedStyle" @input="handleInputLocal" @focus="isFocused = true"></div>
    </template>
    <!-------------------- Viewing ----------------->
    <template v-else>
      <!-- If there is an embed, show only the embed(s) and hide the text -->
      <template v-if="embeddedMedia.length > 0">
        <div class="media-container full-height">
          <template v-for="embed in embeddedMedia" :key="embed.url">
            <MediaEmbed :url="embed.type === 'youtube' ? embed.embedUrl : embed.url" :type="embed.type" />
          </template>
        </div>
      </template>
      <!-- Show both if both are set (no embed, but both content and mediaUrl) -->
      <template v-else-if="content && mediaUrl">
        <div class="text-content half-height" v-html="localContent" ref="contentRef" :style="computedStyle"></div>
        <div class="media-container half-height">
          <img :src="mediaUrl" alt="Card image" style="width: 100%; height: 100%; object-fit: contain;" />
        </div>
      </template>
      <!-- Only content -->
      <div v-else-if="content" class="text-content full-height" v-html="localContent" ref="contentRef" :style="computedStyle"></div>
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
  isFlipped?: boolean
  layout?: string
  cardId: number | string
}>(), {
  showMediaControls: false,
  isFlipped: false
})

const emit = defineEmits(['update'])

const contentRef = ref<HTMLElement | null>(null)
const containerSize = ref({ width: 0, height: 0 })

// Local content state for editing
const localContent = ref('')

const { detectMediaType } = useMediaUtils()
const { getTextStyle } = useDynamicFontSize()

// Use localContent for font size and embed preview while editing
const computedStyle = computed(() => {
  const text = props.isEditing ? localContent.value || '' : props.content || ''
  const fontSize = getTextStyle(text, {
    width: containerSize.value.width,
    height: containerSize.value.height
  }).fontSize
  return { fontSize }
})

function extractEmbeddableMedia(content: string) {
  const urls = (content.match(/https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+/g) || [])
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

// Use localContent for embeddedMedia while editing
const embeddedMedia = computed(() => extractEmbeddableMedia(props.isEditing ? localContent.value : props.content))

const isFocused = ref(false)

// Centralized emit logic for all update events (autosave)
const emitUpdate = (content: string, mediaUrl: string | null = props.mediaUrl, reason = '') => {
  const payload = {
    id: props.cardId,
    [props.side]: { content, mediaUrl }
  }
  if (reason) {
    console.log(`[CardContentCell] emit (${reason})`, payload)
  } else {
    console.log('[CardContentCell] emit', payload)
  }
  emit('update', payload)
}

function handleInputLocal() {
  // Do not update localContent here to avoid cursor jump
  // Let the browser manage the DOM while typing
}

function onBlur() {
  isFocused.value = false
  if (contentRef.value) {
    localContent.value = contentRef.value.innerText
    emitUpdate(localContent.value, props.mediaUrl, 'onBlur')
  }
}

function handlePaste(event: ClipboardEvent) {
  event.preventDefault()
  const text = event.clipboardData?.getData('text') || ''
  document.execCommand('insertText', false, text)
  nextTick(() => {
    if (contentRef.value) {
      localContent.value = contentRef.value.innerText
      // Do not emit here, will be caught by blur or beforeunload
    }
  })
}

function handleMediaRemove(event: MouseEvent) {
  event.preventDefault()
  event.stopPropagation()
  if (contentRef.value) {
    localContent.value = contentRef.value.innerText
    emitUpdate(localContent.value, null, 'handleMediaRemove')
  }
}

function handleEmbedRemove(url: string) {
  console.log('handleEmbedRemove', url)
  // Remove all <a> tags with this URL as href and the raw URL from localContent.value
  let newContent = localContent.value
    // Remove anchor tags with this URL
    .replace(
      new RegExp(`<a[^>]+href=["']${url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>.*?<\\/a>`, 'gi'),
      ''
    )
    // Remove raw URL text
    .split(url).join('')
    // Remove extra whitespace
    .replace(/\s{2,}/g, ' ')
    .trim()

  localContent.value = newContent
  emitUpdate(newContent, props.mediaUrl, 'handleEmbedRemove')
  nextTick(() => {
    measureAndSetContainerSize()
  })
}

function handleKeydown(event: KeyboardEvent) {
  if (!contentRef.value) return
  const isBackspaceOrDelete = event.key === 'Backspace' || event.key === 'Delete'
  if (isBackspaceOrDelete && props.mediaUrl) {
    setTimeout(() => {
      const text = contentRef.value?.innerText || ''
      if (text.trim() === '') {
        emitUpdate('', props.mediaUrl, 'handleKeydown')
      }
    }, 0)
  }
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
  localContent.value = props.content
  measureAndSetContainerSize()
  window.addEventListener('resize', measureAndSetContainerSize)
  window.addEventListener('beforeunload', beforeUnloadHandler)
})

onUnmounted(() => {
  window.removeEventListener('resize', measureAndSetContainerSize)
  window.removeEventListener('beforeunload', beforeUnloadHandler)
  // Optionally emit one last time on unmount for SPA navigation
  if (contentRef.value) {
    localContent.value = contentRef.value.innerText
    emitUpdate(localContent.value, props.mediaUrl, 'onUnmounted')
  }
})

function beforeUnloadHandler() {
  if (contentRef.value) {
    localContent.value = contentRef.value.innerText
    emitUpdate(localContent.value, props.mediaUrl, 'beforeunload')
  }
}

// Minimal watcher: only update localContent from props when not focused
watch(() => props.content, (newContent) => {
  if (!isFocused.value && localContent.value !== newContent) {
    localContent.value = newContent
  }
  measureAndSetContainerSize()
})

watch(localContent, () => {
  measureAndSetContainerSize()
})

watch(() => props.mediaUrl, () => {
  measureAndSetContainerSize()
})

watch(
  () => props.isFlipped,
  (newVal) => {
    if (newVal && props.side === 'back') {
      nextTick(() => {
        measureAndSetContainerSize()
      })
    }
  }
)
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
.card-content-cell.media .text-content {
  font-size: 1em !important;
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
  line-height: 1.5;
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