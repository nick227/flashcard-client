<template>
  <div class="card-content">
    <!-- Edit Mode -->
    <template v-if="mode === 'edit'">
      <div 
        v-if="!isMediaContent"
        class="media-text"
        contenteditable="true"
        v-html="text"
        @input="onInput"
        @focus="onFocus"
        @keydown="onKeyDown"
        :style="{ fontSize: getFontSize(text) }"
      ></div>
      <div v-if="isMediaContent" class="media-preview">
        <YouTubeEmbed v-if="isYouTubeUrl(text)" :url="text" />
        <img v-else-if="isImageUrl(text)" :src="text" :alt="text" />
        <a v-else-if="isWebUrl(text)" :href="text" target="_blank" rel="noopener noreferrer">{{ text }}</a>
      </div>
    </template>

    <!-- View Mode -->
    <template v-else>
      <div class="formatted-content">
        <div v-if="text || imageUrl" v-html="transformContent(text, imageUrl)"></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMediaUtils } from '@/composables/useMediaUtils'
import { useFontSize } from '@/composables/useFontSize'
import YouTubeEmbed from './YouTubeEmbed.vue'
import { useContentTransform } from '@/composables/useContentTransform'
import type { CardViewMode } from '@/composables/useCardMediaStyles'

const props = defineProps<{
  text: string
  imageUrl?: string | null
  mode?: 'edit' | 'view'
  hasText?: boolean
  viewMode?: CardViewMode
}>()

const emit = defineEmits(['update', 'tab'])

const { isYouTubeUrl } = useMediaUtils()
const { getFontSize } = useFontSize()
const { transformContent } = useContentTransform(props.viewMode || 'full')

const isMediaContent = computed(() => {
  return isYouTubeUrl(props.text) || isImageUrl(props.text) || isWebUrl(props.text) || props.imageUrl
})

const isImageUrl = (url: string) => {
  return url?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
}

const isWebUrl = (url: string) => {
  return url?.match(/^https?:\/\//i)
}

const onInput = (e: Event) => {
  const target = e.target as HTMLElement
  const text = target.textContent || ''
  emit('update', text)
}

const onFocus = (e: FocusEvent) => {
  const target = e.target as HTMLElement
  target.focus()
}

const onKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Tab') {
    e.preventDefault()
    emit('tab', e)
  }
}
</script>

<style scoped>
.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Edit Mode Styles */
.media-text {
  flex: 1;
  min-height: 100px;
  padding: 0.5rem;
  border-radius: 4px;
  outline: none;
  background: pink;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.media-text:empty:not(:has(+ .media-preview))::before {
  content: 'Enter text or paste a URL...';
  color: #999;
}

.media-preview {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.media-preview img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}

.media-preview a {
  color: #0066cc;
  text-decoration: none;
  word-break: break-all;
}

.media-preview a:hover {
  text-decoration: underline;
}

/* View Mode Styles */
.formatted-content {
  text-align: center;
  padding: 1rem;
  width: 100%;
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
  user-select: text;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  position: relative;
}

.media-with-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  height: 100%;
  position: relative;
}

.media-with-text .embedded-image {
  max-width: 100%;
  max-height: 33%;
  object-fit: contain;
  border-radius: 0.5rem;
  transition: opacity 0.3s ease;
}

.media-with-text .embedded-image.error {
  opacity: 0.5;
  filter: grayscale(100%);
}

.media-with-text .card-text {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  font-size: 1.3rem;
  font-weight: 600;
  line-height: 1.5;
  text-align: center;
}

.formatted-content .embedded-image {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 0.5rem;
  transition: opacity 0.3s ease;
}

.formatted-content .embedded-image.error {
  opacity: 0.5;
  filter: grayscale(100%);
}

.youtube-container {
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%;
  background: #000;
  border-radius: 0.5rem;
  overflow: hidden;
}

.formatted-content .youtube-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}

.formatted-content .embedded-link {
  color: #0066cc;
  text-decoration: none;
  word-break: break-all;
  padding: 0.5rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s ease;
}

.formatted-content .embedded-link:hover {
  text-decoration: underline;
  background-color: rgba(0, 102, 204, 0.1);
}

/* Loading state */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.embedded-image:not([src]), 
.youtube-iframe:not([src]) {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.card-text {
  font-size: 1.3rem;
  font-weight: 600;
  line-height: 1.5;
  user-select: text;
  -webkit-user-select: text;
  cursor: text;
}

.media-with-text {
  max-height: 33% !important;
}
</style> 