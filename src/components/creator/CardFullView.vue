<template>
  <div class="card-full-view bg-gray-50 rounded-xl p-6 mb-4" :class="{ 'card-success': !isBlank }">
    <!-- Top action buttons: Delete and Preview toggle -->
    <div class="flex justify-between items-center mb-3">
      <button class="button button-danger button-icon text-xs px-3 py-1" @click="onRequestDelete"><i class="fa-solid fa-trash"></i></button>
      <button class="button button-accent text-xs px-3 py-1" @click="previewMode = !previewMode">
        {{ previewMode ? 'Back to Edit' : 'Preview' }}
      </button>
    </div>
    <div class="card-container">
      <!-- Edit mode: show editable front/back fields -->
      <div v-if="!previewMode" class="flex flex-col md:flex-row gap-4 items-start">
        <!-- Front side of the card -->
        <div class="w-full md:flex-1 card-col" style="min-width:0">
          <label class="block text-gray-500 text-xs mb-1">Front</label>
          <div class="card-preview front">
            <div v-if="!localCard.front.imageUrl">
              <div ref="frontRef" class="card-content"
                :class="{ 'input-error': !localCard.front.text && touchedFront }"
                contenteditable="true" @input="onFrontInput" @focus="focusedField = 'front'"
                @blur="touchedFront = true; focusedField = null" @keydown.tab.prevent="focusBack"
                @keydown="onFrontKeydown" :data-placeholder="'Front text...'"
                :style="{ fontSize: getFontSize(localCard.front.text) }"></div>
            </div>
            <div v-else-if="localCard.front.imageUrl && localCard.front.text" class="media-text-stack">
              <div class="embed-media">
                <template v-if="isYouTubeUrl(localCard.front.imageUrl)">
                  <iframe :src="getYouTubeEmbedUrl(localCard.front.imageUrl)" frameborder="0" allowfullscreen class="media-iframe"></iframe>
                </template>
                <template v-else>
                  <img :src="localCard.front.imageUrl" :alt="localCard.front.text" class="media-img" />
                </template>
              </div>
              <div class="media-text">{{ localCard.front.text }}</div>
            </div>
            <div v-else class="embed-preview">
              <div class="embed-media">
                <template v-if="isYouTubeUrl(localCard.front.imageUrl)">
                  <iframe :src="getYouTubeEmbedUrl(localCard.front.imageUrl)" frameborder="0" allowfullscreen class="media-iframe"></iframe>
                </template>
                <template v-else>
                  <img :src="localCard.front.imageUrl" :alt="localCard.front.text" class="media-img" />
                </template>
              </div>
            </div>
          </div>
        </div>
        <!-- Back side of the card -->
        <div class="w-full md:flex-1 card-col" style="min-width:0">
          <label class="block text-gray-500 text-xs mb-1">Back</label>
          <div class="card-preview back">
            <div v-if="!localCard.back.imageUrl">
              <div ref="backRef" class="card-content"
                :class="{ 'input-error': !localCard.back.text && touchedBack }"
                contenteditable="true" @input="onBackInput" @focus="focusedField = 'back'"
                @blur="touchedBack = true; focusedField = null" @keydown.shift.tab.prevent="focusFront"
                @keydown="onBackKeydown" :data-placeholder="'Back text...'"
                :style="{ fontSize: getFontSize(localCard.back.text) }"></div>
            </div>
            <div v-else-if="localCard.back.imageUrl && localCard.back.text" class="media-text-stack">
              <div class="embed-media">
                <template v-if="isYouTubeUrl(localCard.back.imageUrl)">
                  <iframe :src="getYouTubeEmbedUrl(localCard.back.imageUrl)" frameborder="0" allowfullscreen class="media-iframe"></iframe>
                </template>
                <template v-else>
                  <img :src="localCard.back.imageUrl" :alt="localCard.back.text" class="media-img" />
                </template>
              </div>
              <div class="media-text">{{ localCard.back.text }}</div>
            </div>
            <div v-else class="embed-preview">
              <div class="embed-media">
                <template v-if="isYouTubeUrl(localCard.back.imageUrl)">
                  <iframe :src="getYouTubeEmbedUrl(localCard.back.imageUrl)" frameborder="0" allowfullscreen class="media-iframe"></iframe>
                </template>
                <template v-else>
                  <img :src="localCard.back.imageUrl" :alt="localCard.back.text" class="media-img" />
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- Preview mode: show card scaffold component -->
      <div v-else>
        <FlashCardScaffold :card="localCard" :flipped="flipped" :editable="false" :inlineEditable="true"
          @update:card="onInlineEdit" @flip="handleFlip" />
      </div>
    </div>
    <!-- Hint input field -->
    <div class="mt-3">
      <input type="text" class="input w-full" v-model="localCard.hint" @input="emitUpdate" placeholder="Hint..." />
    </div>
    <!-- Error message if front or back is blank -->
    <div v-if="isBlank && (touchedFront || touchedBack)" class="text-red-500 text-xs mt-2">Front and back are required.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted } from 'vue'
import FlashCardScaffold from '@/components/common/FlashCardScaffold.vue'
import type { Card } from '@/types/card'

// --- Props and Emits ---
const props = defineProps<{ card: Card, autoFocus?: boolean }>()
const emit = defineEmits(['update-card', 'delete-card', 'request-delete'])

// --- Local State ---
const localCard = ref({ ...props.card })
const frontRef = ref<HTMLElement | null>(null)
const backRef = ref<HTMLElement | null>(null)
const focusedField = ref<string | null>(null)
const touchedFront = ref(false)
const touchedBack = ref(false)
const previewMode = ref(false)
const flipped = ref(false)
const isFlipping = ref(false)
const isNavigating = ref(false)

// --- Helper Functions ---
function isYouTubeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(url)
}
function getYouTubeEmbedUrl(url: string): string {
  // Extract video ID and return embed URL
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : url
}

// --- Watchers ---
onMounted(() => {
  console.log('Component mounted, initial state:', {
    front: props.card.front,
    back: props.card.back
  })

  // Ensure proper card structure
  localCard.value = {
    ...props.card,
    front: {
      text: props.card.front?.text || '',
      imageUrl: props.card.front?.imageUrl || null
    },
    back: {
      text: props.card.back?.text || '',
      imageUrl: props.card.back?.imageUrl || null
    }
  }

  // Initialize text content
  nextTick(() => {
    if (frontRef.value) {
      frontRef.value.textContent = localCard.value.front.text
    }
    if (backRef.value) {
      backRef.value.textContent = localCard.value.back.text
    }
  })
})

// Update the watcher to handle subsequent updates
watch(() => props.card, (newCard) => {
  if (JSON.stringify(newCard) !== JSON.stringify(localCard.value)) {
    console.log('Card updated:', {
      front: newCard.front,
      back: newCard.back
    })

    // Ensure proper card structure
    localCard.value = {
      ...newCard,
      front: {
        text: newCard.front?.text || '',
        imageUrl: newCard.front?.imageUrl || null
      },
      back: {
        text: newCard.back?.text || '',
        imageUrl: newCard.back?.imageUrl || null
      }
    }
    
    // Update text content
    nextTick(() => {
      if (frontRef.value) {
        frontRef.value.textContent = localCard.value.front.text
      }
      if (backRef.value) {
        backRef.value.textContent = localCard.value.back.text
      }
    })
  }
}, { deep: true })

// --- Handlers ---
const emitUpdate = () => {
  console.log('Emitting update:', {
    frontText: localCard.value.front.text,
    backText: localCard.value.back.text
  })

  emit('update-card', { ...localCard.value })
}
const onFrontInput = (e: Event) => {
  const target = e.target as HTMLElement
  localCard.value.front.text = target.textContent || ''
  emitUpdate()
}
const onBackInput = (e: Event) => {
  const target = e.target as HTMLElement
  localCard.value.back.text = target.textContent || ''
  emitUpdate()
}
const onFrontKeydown = (e: KeyboardEvent) => {
  if (localCard.value.front.imageUrl && (e.key === 'Backspace' || e.key === 'Delete')) {
    removeFrontEmbed()
    e.preventDefault()
  }
}
const onBackKeydown = (e: KeyboardEvent) => {
  if (localCard.value.back.imageUrl && (e.key === 'Backspace' || e.key === 'Delete')) {
    removeBackEmbed()
    e.preventDefault()
  }
}
const removeFrontEmbed = () => {
  localCard.value.front.imageUrl = null
  nextTick(() => frontRef.value?.focus())
}
const removeBackEmbed = () => {
  localCard.value.back.imageUrl = null
  nextTick(() => backRef.value?.focus())
}
const focusBack = () => nextTick(() => backRef.value?.focus())
const focusFront = () => nextTick(() => frontRef.value?.focus())
const onRequestDelete = () => emit('request-delete', localCard.value.id)
const onInlineEdit = (updatedCard: Card) => {
  localCard.value = { ...updatedCard }
  emitUpdate()
}
const isBlank = computed(() => {
  return (!localCard.value.front.text && !localCard.value.front.imageUrl) || 
         (!localCard.value.back.text && !localCard.value.back.imageUrl)
})
watch(() => props.autoFocus, (val) => {
  if (val) nextTick(() => frontRef.value?.focus())
}, { immediate: true })
watch([() => props.card, previewMode], ([newCard, mode], [oldCard]) => {
  if (mode === false || newCard?.id !== oldCard?.id) {
    isNavigating.value = true
    flipped.value = false
    isFlipping.value = false
    setTimeout(() => { isNavigating.value = false }, 50)
  }
})
const handleFlip = (newFlippedState: boolean) => {
  if (isFlipping.value || isNavigating.value) return
  isFlipping.value = true
  flipped.value = newFlippedState
  setTimeout(() => { isFlipping.value = false }, 300)
}

// Dynamically adjust font size based on text length
function getFontSize(text: string | undefined): string {
  const length = text?.length || 0
  if (length > 500) return '1.4rem'
  if (length > 300) return '1.8rem'
  if (length > 150) return '2rem'
  return '2.2rem'
}

</script>

<style scoped>
.card-full-view {
  background: #f8fafc;
  border: 1.5px solid #e5e7eb;
  border-radius: 1.25rem;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
}

.card-col {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .card-col {
    width: calc(50% - 0.5rem);
    /* gap-4 is 1rem, so each side gets half the gap */
  }
}

.card-full-view:focus-within {
  border-color: #2563eb;
}

.card-error {
  border-color: #ef4444 !important;
}

.card-container {
  min-height: 430px;
  display: flex;
  flex-direction: column;
  width: 100%;
  box-sizing: border-box;
}

.card-preview {
  min-height: 200px;
  height: auto;
  aspect-ratio: 16/9;
  border-radius: 1.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  box-sizing: border-box;
  padding: 1rem;
}

@media (min-width: 768px) {
  .card-preview {
    min-height: 400px;
    height: 400px;
    aspect-ratio: auto;
  }

  .card-content {
    padding: 1.5rem;
  }
}

.card-preview:hover {
  transform: translateY(-2px);
}

.card-preview.front {
  background: #fff;
  border: 1px solid #e5e7eb;
}

.card-preview.back {
  background: #2563eb;
  border: 1px solid #2563eb;
  color: #fff;
}

.card-content {
  width: 100%;
  height: 100%;
  padding: 1.5rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  color: inherit;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
  position: relative;
  transform: translateY(-2%);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  cursor: text;
  perspective: 1000px;
  transition: font-size 0.2s ease;
  overflow-y: auto;
  box-sizing: border-box;
}

.card-content:empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-content:empty:before {
  content: attr(data-placeholder);
  color: #9ca3af;
  opacity: 0.7;
  pointer-events: none;
}

.card-preview.back .card-content:empty:before {
  color: #e5e7eb;
}

.card-preview.front .card-content {
  color: #222;
}

.card-preview.back .card-content {
  color: #fff;
}

.card-content:focus {
  outline: none;
}

.card-preview.front:focus-within {
  border-color: #2563eb;
}

.card-preview.back:focus-within {
  border-color: #3b82f6;
}

/* EMBED CSS */

.embed-preview {
  margin-top: 0.5em;
  width: 100%;
  position: relative;
  display: block;
  height: 100%;
}

.embed-media {
  width: 100%;
  height: 100%;
  display: block;
}

.embed-preview iframe,
.embed-preview img {
  max-width: 100%;
  border-radius: 0.5em;
  display: block;
  margin: 0 auto;
}

.remove-embed-btn,
.image-mode-btn {
  position: absolute;
  top: 0.5em;
  z-index: 10;
  background: rgba(255, 255, 255, 0.85);
  border: none;
  border-radius: 50%;
  font-size: 1.2em;
  cursor: pointer;
  padding: 0.2em 0.4em;
  transition: background 0.2s;
  display: none;
}

.remove-embed-btn {
  right: 0.5em;
}

.image-mode-btn {
  right: 2.5em;
}

.card-col:hover .remove-embed-btn,
.card-col:hover .image-mode-btn {
  display: block;
}

.embed-preview iframe {
  display: block;
  margin: 0 auto;
  max-width: 100%;
  width: 100%;
  height: 315px;
  border-radius: 0.5em;
}

.card-content {
  width: calc(100% - 3rem);
  height: calc(100% - 3rem);
  padding: 1.5rem;
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  color: inherit;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
  position: relative;
  transform: translateY(-2%);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  cursor: text;
  perspective: 1000px;
  transition: font-size 0.2s ease;
  overflow-y: auto;
  box-sizing: border-box;
}

.embed-preview {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.embed-media {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.embed-media iframe,
.embed-media img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 0.5em;
  display: block;
  margin: 0 auto;
}

.embed-media iframe {
  width: 100%;
  height: 315px;
}

@media (min-width: 768px) {
  .embed-media iframe {
    height: 400px;
  }
}

.media-text-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  gap: 1rem;
  padding: 1rem 0;
}
.media-text-stack .embed-media {
  height: 75%;
  width: auto;
  max-width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.media-img, .media-iframe {
  max-width: 100%;
  max-height: 100%;
  border-radius: 0.5em;
  display: block;
  margin: 0 auto;
}
.media-text {
  width: 100%;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 500;
  color: inherit;
  word-break: break-word;
  padding: 0.5rem 0.5rem 0 0.5rem;
  flex: 1 1 0;
  overflow-y: auto;
}
@media (min-width: 768px) {
  .media-img, .media-iframe {
    max-height: 350px;
  }
  .media-text-stack {
    gap: 1.5rem;
    padding: 1.5rem 0;
  }
  .media-text-stack .embed-media {
    height: 75%;
  }
}
</style>