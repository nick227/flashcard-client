<template>
  <div class="card-full-view bg-gray-50 rounded-xl shadow p-6 mb-4" :class="{ 'card-success': !isBlank }">
    <!-- Top action buttons: Delete and Preview toggle -->
    <div class="flex justify-between items-center mb-3">
      <button class="button button-danger text-xs px-3 py-1" @click="onRequestDelete">Delete</button>
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
            <div v-if="!frontEmbedHtml" ref="frontRef" class="card-content"
              :class="{ 'input-error': !localCard.front.trim() && touchedFront, 'hidden-input': frontEmbedHtml }"
              contenteditable="true" @input="onFrontInput" @focus="focusedField = 'front'"
              @blur="touchedFront = true; focusedField = null" @keydown.tab.prevent="focusBack"
              @keydown="onFrontKeydown" :data-placeholder="'Front text...'"
              :style="{ fontSize: getFontSize(localCard.front) }"></div>
            <div v-else-if="frontEmbedHtml" class="embed-preview">
              <div class="embed-media" v-html="frontEmbedHtml"></div>
              <button class="remove-embed-btn" @click="removeFrontEmbed" title="Remove media">🗑️</button>
              <button v-if="frontEmbedHtml && frontEmbedHtml.includes('<img')" class="image-mode-btn"
                @click="cycleFrontImageMode" :title="'Image mode: ' + frontImageMode">🖼️</button>
            </div>
          </div>
        </div>
        <!-- Back side of the card -->
        <div class="w-full md:flex-1 card-col" style="min-width:0">
          <label class="block text-gray-500 text-xs mb-1">Back</label>
          <div class="card-preview back">
            <div v-if="!backEmbedHtml" ref="backRef" class="card-content"
              :class="{ 'input-error': !localCard.back.trim() && touchedBack, 'hidden-input': backEmbedHtml }"
              contenteditable="true" @input="onBackInput" @focus="focusedField = 'back'"
              @blur="touchedBack = true; focusedField = null" @keydown.shift.tab.prevent="focusFront"
              @keydown="onBackKeydown" :data-placeholder="'Back text...'"
              :style="{ fontSize: getFontSize(localCard.back) }"></div>
            <div v-if="backEmbedHtml" class="embed-preview">
              <div class="embed-media" v-html="backEmbedHtml"></div>
              <button class="remove-embed-btn" @click="removeBackEmbed" title="Remove media">🗑️</button>
              <button v-if="backEmbedHtml && backEmbedHtml.includes('<img')" class="image-mode-btn"
                @click="cycleBackImageMode" :title="'Image mode: ' + backImageMode">🖼️</button>
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
    <div v-if="isBlank && (touchedFront || touchedBack)" class="text-red-500 text-xs mt-2">Front and back are required.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick, onMounted } from 'vue'
import FlashCardScaffold from '@/components/common/FlashCardScaffold.vue'
import { mediaCheck } from '@/composables/useMediaEmbed'
import type { FlashCard } from '@/types/flashCard'

// --- Props and Emits ---
const props = defineProps<{ card: FlashCard, autoFocus?: boolean }>()
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

// --- Image Embed Modes ---
const imageModes = ['contain', 'cover', 'original', 'centered'] as const
// Type for image mode
type ImageMode = typeof imageModes[number]
const frontImageMode = ref<ImageMode>('contain')
const backImageMode = ref<ImageMode>('contain')

const frontEmbedSource = ref('')
const backEmbedSource = ref('')

// --- Watchers ---
onMounted(() => {
  console.log('Component mounted, initial state:', {
    front: props.card.front,
    back: props.card.back,
    frontEmbedSource: frontEmbedSource.value,
    backEmbedSource: backEmbedSource.value
  })

  // Process initial content
  const processContent = (content: string | undefined) => {
    const trimmed = content?.trim() || ''
    console.log('Processing initial content:', trimmed)

    // Check if content is HTML (iframe or img tag)
    if (/<iframe|<img/i.test(trimmed)) {
      console.log('Found initial HTML embed:', trimmed)
      return { embedSource: trimmed, text: '' }
    }

    // Then check if it's a URL that should be embedded
    const embedHtml = mediaCheck(trimmed)
    if (embedHtml) {
      console.log('Found initial URL to embed:', trimmed)
      return { embedSource: trimmed, text: '' }
    }

    return { embedSource: '', text: trimmed }
  }

  // Process and set initial state
  const frontResult = processContent(props.card.front)
  const backResult = processContent(props.card.back)

  frontEmbedSource.value = frontResult.embedSource
  backEmbedSource.value = backResult.embedSource
  localCard.value.front = frontResult.text
  localCard.value.back = backResult.text

  // Update DOM after state is set
  nextTick(() => {
    if (frontRef.value) frontRef.value.textContent = localCard.value.front
    if (backRef.value) backRef.value.textContent = localCard.value.back

    console.log('After initial nextTick:', {
      frontEmbedHtml: frontEmbedHtml.value,
      backEmbedHtml: backEmbedHtml.value,
      frontEmbedSource: frontEmbedSource.value,
      backEmbedSource: backEmbedSource.value
    })
  })
})

// Update the watcher to handle subsequent updates
watch(() => props.card, (newCard) => {
  if (JSON.stringify(newCard) !== JSON.stringify(localCard.value)) {
    console.log('Card updated:', {
      front: newCard.front,
      back: newCard.back
    })

    // Process content
    const processContent = (content: string | undefined) => {
      const trimmed = content?.trim() || ''
      console.log('Processing updated content:', trimmed)

      // Check if content is HTML (iframe or img tag)
      if (/<iframe|<img/i.test(trimmed)) {
        console.log('Found updated HTML embed:', trimmed)
        return { embedSource: trimmed, text: '' }
      }

      // Then check if it's a URL that should be embedded
      const embedHtml = mediaCheck(trimmed)
      if (embedHtml) {
        console.log('Found updated URL to embed:', trimmed)
        return { embedSource: trimmed, text: '' }
      }

      return { embedSource: '', text: trimmed }
    }

    // Process and update state
    const frontResult = processContent(newCard.front)
    const backResult = processContent(newCard.back)

    // Update state in a single batch
    localCard.value = { ...newCard }
    frontEmbedSource.value = frontResult.embedSource
    backEmbedSource.value = backResult.embedSource
    localCard.value.front = frontResult.text
    localCard.value.back = backResult.text

    // Update DOM after state changes
    nextTick(() => {
      if (frontRef.value) frontRef.value.textContent = localCard.value.front
      if (backRef.value) backRef.value.textContent = localCard.value.back

      console.log('After update nextTick:', {
        frontEmbedHtml: frontEmbedHtml.value,
        backEmbedHtml: backEmbedHtml.value,
        frontEmbedSource: frontEmbedSource.value,
        backEmbedSource: backEmbedSource.value
      })
    })
  }
}, { deep: true })

// --- Computed: Embed Previews ---
const frontEmbedHtml = computed(() => {
  const src = frontEmbedSource.value?.trim() || ''
  console.log('Computing frontEmbedHtml:', { src })

  if (!src) return false

  // If it's already HTML, use it directly
  if (/<iframe|<img/i.test(src)) {
    console.log('Using direct HTML for front')
    return src
  }

  // Otherwise try to convert URL to embed
  const result = mediaCheck(src)
  console.log('Media check result for front:', result)
  return result || false
})
const backEmbedHtml = computed(() => {
  const src = backEmbedSource.value?.trim() || ''
  console.log('Computing backEmbedHtml:', { src })

  if (!src) return false

  // If it's already HTML, use it directly
  if (/<iframe|<img/i.test(src)) {
    console.log('Using direct HTML for back')
    return src
  }

  // Otherwise try to convert URL to embed
  const result = mediaCheck(src)
  console.log('Media check result for back:', result)
  return result || false
})

// --- Handlers ---
const emitUpdate = () => {
  console.log('Emitting update:', {
    frontEmbedHtml: frontEmbedHtml.value,
    backEmbedHtml: backEmbedHtml.value,
    frontText: localCard.value.front,
    backText: localCard.value.back
  })

  // If we have an embed HTML, use that, otherwise use the text
  const front = frontEmbedHtml.value || localCard.value.front.trim()
  const back = backEmbedHtml.value || localCard.value.back.trim()

  console.log('Final values:', { front, back })
  emit('update-card', { ...localCard.value, front, back })
}
const onFrontInput = (e: Event) => {
  const target = e.target as HTMLElement
  const newText = target.textContent || ''
  const embed = mediaCheck(newText)
  if (embed && (embed.includes('<iframe') || embed.includes('<img'))) {
    setTimeout(() => {
      localCard.value.front = ''
      target.textContent = ''
      frontEmbedSource.value = newText
      adjustCardHeight(target)
      emitUpdate()
    }, 0)
  } else {
    localCard.value.front = newText
    frontEmbedSource.value = ''
    adjustCardHeight(target)
    emitUpdate()
  }
}
const onBackInput = (e: Event) => {
  const target = e.target as HTMLElement
  const newText = target.textContent || ''
  const embed = mediaCheck(newText)
  if (embed && (embed.includes('<iframe') || embed.includes('<img'))) {
    setTimeout(() => {
      localCard.value.back = ''
      target.textContent = ''
      backEmbedSource.value = newText
      adjustCardHeight(target)
      emitUpdate()
    }, 0)
  } else {
    localCard.value.back = newText
    backEmbedSource.value = ''
    adjustCardHeight(target)
    emitUpdate()
  }
}
const onFrontKeydown = (e: KeyboardEvent) => {
  if (frontEmbedHtml.value && (e.key === 'Backspace' || e.key === 'Delete')) {
    frontEmbedSource.value = ''
    e.preventDefault()
    nextTick(() => frontRef.value?.focus())
  }
}
const onBackKeydown = (e: KeyboardEvent) => {
  if (backEmbedHtml.value && (e.key === 'Backspace' || e.key === 'Delete')) {
    backEmbedSource.value = ''
    e.preventDefault()
    nextTick(() => backRef.value?.focus())
  }
}
const removeFrontEmbed = () => {
  frontEmbedSource.value = ''
  nextTick(() => frontRef.value?.focus())
}
const removeBackEmbed = () => {
  backEmbedSource.value = ''
  nextTick(() => backRef.value?.focus())
}
const cycleFrontImageMode = () => {
  const idx = imageModes.indexOf(frontImageMode.value)
  frontImageMode.value = imageModes[(idx + 1) % imageModes.length]
}
const cycleBackImageMode = () => {
  const idx = imageModes.indexOf(backImageMode.value)
  backImageMode.value = imageModes[(idx + 1) % imageModes.length]
}
const focusBack = () => nextTick(() => backRef.value?.focus())
const focusFront = () => nextTick(() => frontRef.value?.focus())
const onRequestDelete = () => emit('request-delete', localCard.value.id)
const onInlineEdit = (updated: FlashCard) => {
  localCard.value = { ...updated }
  emitUpdate()
}
const isBlank = computed(() =>
  !(localCard.value.front.trim() || frontEmbedSource.value.trim()) ||
  !(localCard.value.back.trim() || backEmbedSource.value.trim())
)
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
function getFontSize(text: string): string {
  const length = text.length
  if (length > 500) return '1.4rem'
  if (length > 300) return '1.8rem'
  if (length > 150) return '2rem'
  return '2.2rem'
}

// Adjust card preview height for overflow (desktop only)
function adjustCardHeight(element: HTMLElement) {
  const cardPreview = element.closest('.card-preview') as HTMLElement
  if (!cardPreview) return

  const isOverflowing = element.scrollHeight > element.clientHeight
  if (isOverflowing && window.innerWidth >= 768) {
    cardPreview.style.height = `${element.scrollHeight + 80}px` // 40px top + 40px bottom
    cardPreview.style.aspectRatio = 'auto'
  } else {
    cardPreview.style.height = ''
    cardPreview.style.aspectRatio = '16/9'
  }
}

</script>

<style scoped>
.card-full-view {
  background: #f8fafc;
  border: 1.5px solid #e5e7eb;
  border-radius: 1.25rem;
  box-shadow: 0 4px 24px 0 rgba(30, 41, 59, 0.08);
  transition: box-shadow 0.18s, border-color 0.18s;
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
  box-shadow: 0 0 0 2px #2563eb33;
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
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  width: 100%;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .card-preview {
    min-height: 400px;
    height: 400px;
    aspect-ratio: auto;
  }

  .card-content {
    padding: 2.5rem;
  }
}

.card-preview:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.card-preview.front {
  background: #fff;
  border: 1px solid #e5e7eb;
}

.card-preview.back {
  background: #2563eb;
  border: 1px solid #2563eb;
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
  box-shadow: 0 0 0 2px #2563eb33;
  border-color: #2563eb;
}

.card-preview.back:focus-within {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
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
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
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
</style>