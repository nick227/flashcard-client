<template>
  <div
    class="flashcard-scaffold card flex flex-col items-center justify-center w-full mx-auto relative"
    :class="{ small: size === 'small' }"
    :tabindex="editable ? -1 : 0"
    :aria-label="editable ? 'Edit flash card' : 'Flash card'"
    @click="onCardClick"
    @dblclick="onDoubleClick"
    @keydown.space.prevent="!editable && handleFlip()"
    @keydown.enter.prevent="!editable && handleFlip()"
    :style="{ cursor: editable ? 'default' : 'pointer' }"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
  >
    <div class="card-content" :class="{ 'is-flipped': isFlipped, 'is-flipping': isFlipping }">
      <div v-show="!isFlipped" class="card-face front">
        <CardContent 
          :card="card"
          :mode="editable ? 'edit' : 'view'"
          side="front"
          :title="props.title || ''"
          :description="props.description || ''"
          :category="props.category || ''"
          @update="onFrontUpdate"
        />
      </div>
      <div v-show="isFlipped" class="card-face back">
        <CardContent 
          :card="card"
          :mode="editable ? 'edit' : 'view'"
          side="back"
          :title="props.title || ''"
          :description="props.description || ''"
          :category="props.category || ''"
          @update="onBackUpdate"
        />
      </div>
    </div>
    <slot name="controls"></slot>
    <button v-if="editable && showControls" class="button button-danger button-icon absolute top-4 right-4 z-10" @click.stop="$emit('delete')"><i class="fa-solid fa-trash"></i></button>
    <div v-if="showHint && card?.hint" class="hint-text text-base text-gray-700 mt-4 w-full text-left px-2">{{ card.hint }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { FlashCard } from '@/types/card'
import CardContent from './CardContent.vue'

const props = defineProps<{
  card: FlashCard
  editable?: boolean
  flipped?: boolean
  showControls?: boolean
  showHint?: boolean
  mode?: 'view' | 'edit' | 'preview'
  inlineEditable?: boolean
  size?: 'normal' | 'small'
  title?: string
  description?: string
  category?: string
}>()

const emit = defineEmits<{
  'update:card': [card: FlashCard]
  'flip': [flipped: boolean]
  'delete': []
  'next': []
  'prev': []
}>()

// State management
const localFlipped = ref(false)
const isFlipping = ref(false)
const flipTimeout = ref<number | null>(null)
const isNavigating = ref(false)
const lastClickTime = ref(0)
const clickTimeout = ref<number | null>(null)
const touchStartX = ref(0)
const touchStartY = ref(0)
const isSwiping = ref(false)

// Constants
const SWIPE_THRESHOLD = 50
const CLICK_DELAY = 300
const FLIP_ANIMATION_DURATION = 300

// Computed properties
const isFlipped = computed(() => props.flipped !== undefined ? props.flipped : localFlipped.value)

// Add debug logging
watch(() => props.card, () => {
}, { immediate: true })

// Reset flip state when card changes
watch(() => props.card, () => {
  clearTimeouts()
  isNavigating.value = true
  localFlipped.value = false
  isFlipping.value = false
  
  setTimeout(() => {
    isNavigating.value = false
  }, 50)
})

// Click handling
function onCardClick() {
  const now = Date.now()
  const timeSinceLastClick = now - lastClickTime.value
  
  // Check if user is selecting text
  const selection = window.getSelection()
  if (selection?.toString()) {
    clearClickTimeout()
    return
  }
  
  // Remove selection if clicking without text selected
  if (!selection?.toString()) {
    selection?.removeAllRanges()
    const textElements = document.querySelectorAll('.card-text')
    textElements.forEach(element => {
      element.classList.remove('highlight')
    })
  }
  
  if (timeSinceLastClick < CLICK_DELAY) {
    clearClickTimeout()
    return
  }
  
  lastClickTime.value = now
  
  if (!props.editable) {
    clickTimeout.value = window.setTimeout(handleFlip, CLICK_DELAY)
  }
}

function onDoubleClick(e: MouseEvent) {
  // Check if user is selecting text
  const selection = window.getSelection()
  if (selection?.toString()) {
    // If text is already selected, don't do anything
    return
  }

  // Get the text element that was double-clicked
  const textElement = (e.target as HTMLElement).closest('.card-text')
  if (!textElement) return

  // Create a range to select the text
  const range = document.createRange()
  range.selectNodeContents(textElement)
  
  // Clear any existing selection and add our new one
  selection?.removeAllRanges()
  selection?.addRange(range)

  // Add highlight class for visual feedback
  textElement.classList.add('highlight')
}

// Flip handling
function handleFlip() {
  if (isFlipping.value || isNavigating.value) return
  
  // Clear selection when flipping
  const selection = window.getSelection()
  selection?.removeAllRanges()
  
  // Remove highlight
  const textElements = document.querySelectorAll('.card-text')
  textElements.forEach(element => {
    element.classList.remove('highlight')
  })
  
  isFlipping.value = true
  const newFlippedState = !isFlipped.value
  
  if (props.flipped !== undefined) {
    emit('flip', newFlippedState)
  } else {
    localFlipped.value = newFlippedState
    emit('flip', localFlipped.value)
  }
  
  flipTimeout.value = window.setTimeout(() => {
    isFlipping.value = false
  }, FLIP_ANIMATION_DURATION)
}

// Swipe handling
const isHorizontalSwipe = (diffX: number, diffY: number): boolean => {
  return Math.abs(diffX) > Math.abs(diffY)
}

const handleSwipeEnd = (diffX: number, diffY: number) => {
  if (Math.abs(diffX) > SWIPE_THRESHOLD && isHorizontalSwipe(diffX, diffY)) {
    emit('flip', false)
    diffX < 0 ? emit('next') : emit('prev')
  }
  isSwiping.value = false
}

const onTouchStart = (e: TouchEvent) => {
  touchStartX.value = e.changedTouches[0].clientX
  touchStartY.value = e.changedTouches[0].clientY
  isSwiping.value = true
}

const onTouchEnd = (e: TouchEvent) => {
  if (!isSwiping.value) return
  const diffX = e.changedTouches[0].clientX - touchStartX.value
  const diffY = e.changedTouches[0].clientY - touchStartY.value
  handleSwipeEnd(diffX, diffY)
}

const onMouseDown = (e: MouseEvent) => {
  touchStartX.value = e.clientX
  touchStartY.value = e.clientY
  isSwiping.value = true
  e.preventDefault()
}

const onMouseUp = (e: MouseEvent) => {
  if (!isSwiping.value) return
  const diffX = e.clientX - touchStartX.value
  const diffY = e.clientY - touchStartY.value
  handleSwipeEnd(diffX, diffY)
}

// Utility functions
function clearClickTimeout() {
  if (clickTimeout.value) {
    clearTimeout(clickTimeout.value)
    clickTimeout.value = null
  }
}

function clearTimeouts() {
  if (flipTimeout.value) {
    clearTimeout(flipTimeout.value)
    flipTimeout.value = null
  }
  clearClickTimeout()
}

// Deselect highlight if clicking outside the card
function handleDocumentClick(e: MouseEvent) {
  const cardEl = document.querySelector('.flashcard-scaffold')
  if (!cardEl) return
  if (!cardEl.contains(e.target as Node)) {
    // Remove highlight
    const textElements = document.querySelectorAll('.card-text')
    textElements.forEach(element => {
      element.classList.remove('highlight')
    })
    // Remove selection
    const selection = window.getSelection()
    selection?.removeAllRanges()
  }
}

// Touch handling
onMounted(() => {
  const element = document.querySelector('.flashcard-scaffold')
  if (element) {
    element.addEventListener('touchmove', (e: Event) => {
      if (!isSwiping.value) return
      const touchEvent = e as TouchEvent
      const diffX = touchEvent.changedTouches[0].clientX - touchStartX.value
      const diffY = touchEvent.changedTouches[0].clientY - touchStartY.value
      if (isHorizontalSwipe(diffX, diffY)) {
        e.preventDefault()
      }
    }, { passive: false })
  }
  document.addEventListener('mousedown', handleDocumentClick)
})

onUnmounted(() => {
  clearTimeouts()
  const element = document.querySelector('.flashcard-scaffold')
  if (element) {
    element.removeEventListener('touchmove', () => {})
  }
  document.removeEventListener('mousedown', handleDocumentClick)
})

function onFrontUpdate(updatedCard: FlashCard) {
  console.log('FlashCardScaffold - Front update:', {
    original: props.card.front,
    updated: updatedCard.front
  })
  emit('update:card', {
    ...props.card,
    front: {
      text: typeof updatedCard.front.text === 'string' ? updatedCard.front.text : '',
      imageUrl: updatedCard.front.imageUrl,
      layout: updatedCard.front.layout
    }
  })
}

function onBackUpdate(updatedCard: FlashCard) {
  console.log('FlashCardScaffold - Back update:', {
    original: props.card.back,
    updated: updatedCard.back
  })
  emit('update:card', {
    ...props.card,
    back: {
      text: typeof updatedCard.back.text === 'string' ? updatedCard.back.text : '',
      imageUrl: updatedCard.back.imageUrl,
      layout: updatedCard.back.layout
    }
  })
}
</script>

<style scoped>
.flashcard-scaffold {
  touch-action: pan-y pinch-zoom;
  user-select: text; /* Changed from none to allow text selection */
  -webkit-user-select: text;
  -webkit-touch-callout: default;
  border-radius: 1rem;
  width: 100%;
  min-height: 400px;
  transition: transform 0.3s ease;
  background: white;
  position: relative;
  perspective: 1000px;
  will-change: transform; /* Performance optimization */
}

.fullscreen .flashcard-scaffold {
  height: 70vh; /* Changed from 70% to vh for better responsiveness */
}

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
}

.formatted-content img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 0.5rem;
}

.card-content {
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
  will-change: transform; /* Performance optimization */
}

.card-content.is-flipping {
  transition: transform 0.3s ease;
}

.card-content.is-flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  padding: 0;
  overflow: hidden; /* Add this to contain the iframe */
}

.card-face.front {
  background: white;
  transform: rotateY(0deg);
}

.card-face.back {
  background: #2563eb;
  transform: rotateY(180deg);
  color: white;
}

.card-face .formatted-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

/* Update YouTube iframe styles */
.card-face .youtube-iframe {
  width: 100% !important;
  height: 100% !important;
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: 16/9;
}

.card-text {
  font-size: 1.3rem;
  font-weight: 600;
  color: inherit;
  line-height: 1.5;
  user-select: text;
  -webkit-user-select: text;
  cursor: text;
}

.fullscreen .card-text {
  font-size: 2rem;
}

.card-face .formatted-content img,
.card-face .formatted-content iframe {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.media-with-text {
  max-height: 33% !important;
}

/* Add focus styles for better accessibility */
.flashcard-scaffold:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Update highlight animation to use primary blue */
@keyframes highlight {
  0% { background-color: rgba(37, 99, 235, 0.2); }
  100% { background-color: rgba(37, 99, 235, 0.1); }
}

.highlight {
  animation: highlight 0.2s ease-out forwards;
  color: white;
  background-color: rgba(37, 99, 235, 0.1);
}

/* Ensure text remains selectable during flip */
.card-content.is-flipping .card-text {
  user-select: text;
  -webkit-user-select: text;
}

/* Add natural selection color */
.card-text::selection {
  background-color: rgb(37, 99, 235);
  color: white;
}

.card-text::-moz-selection {
  background-color: rgb(37, 99, 235);
  color: white;
}

.flashcard-scaffold.small {
  min-height: 180px;
  max-width: 100%;
  font-size: 0.95rem;
}
.flashcard-scaffold.small .formatted-content {
  padding: 0.5rem;
}
.flashcard-scaffold.small .card-text {
  font-size: 1rem;
  padding: 0.25rem;
}
/* Only limit media height in small cards when there is also text */
.flashcard-scaffold.small .media-with-text {
  max-height: 60px !important;
}

/* Ensure proper sizing for small cards */
.flashcard-scaffold.small .card-face {
  padding: 0.5rem;
}

.flashcard-scaffold.small .youtube-iframe {
  max-height: 150px;
}
</style>
