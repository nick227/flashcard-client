<template>
  <div class="card-content">
    <div 
      v-if="!isYouTubeUrl(props.text) && !props.text?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) && !props.text?.match(/^https?:\/\//i)"
      class="media-text"
      contenteditable="true"
      v-html="props.text"
      @input="onInput"
      @focus="onFocus"
      :style="{ fontSize: getFontSize(props.text) }"
    ></div>
    <div v-if="isYouTubeUrl(props.text)" class="media-preview">
      <YouTubeEmbed :url="props.text" />
    </div>
    <div v-else-if="props.text?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)" class="media-preview">
      <img :src="props.text" alt="Card image" />
    </div>
    <div v-else-if="props.text?.match(/^https?:\/\//i)" class="media-preview">
      <a :href="props.text" target="_blank" rel="noopener noreferrer">{{ props.text }}</a>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMediaUtils } from '@/composables/useMediaUtils'
import { useFontSize } from '@/composables/useFontSize'
import YouTubeEmbed from '@/components/common/YouTubeEmbed.vue'

const emit = defineEmits(['update'])
const props = defineProps<{
  text: string
}>()

const { isYouTubeUrl } = useMediaUtils()
const { getFontSize } = useFontSize()

const onInput = (e: Event) => {
  const target = e.target as HTMLElement
  const text = target.textContent || ''
  
  // Check if the text is a URL
  if (isYouTubeUrl(text) || /^https?:\/\//i.test(text) || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(text)) {
    // Keep the URL as is in the contenteditable
    target.textContent = text
  }
  emit('update', text)
}

const onFocus = (e: FocusEvent) => {
  const target = e.target as HTMLElement
  target.focus()
}
</script>

<style scoped>
.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

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
</style> 