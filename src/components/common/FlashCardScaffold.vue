<template>
  <div
    class="flashcard-scaffold card flex flex-col items-center justify-center w-full mx-auto relative"
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
        <div class="text-2xl font-semibold formatted-content" v-html="card?.front || 'No front content'"></div>
      </div>
      <div v-show="isFlipped" class="card-face back">
        <div class="text-2xl font-semibold formatted-content" v-html="card?.back || 'No back content'"></div>
      </div>
    </div>
    <slot name="controls"></slot>
    <button v-if="editable && showControls" class="button button-danger absolute top-4 right-4 z-10" @click.stop="$emit('delete')">Delete</button>
    <div v-if="showHint && card?.hint" class="hint-text text-base text-gray-700 mt-4 w-full text-left px-2" v-html="card.hint"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { FlashCard } from '@/types'

const props = defineProps<{
  card: FlashCard
  editable?: boolean
  flipped?: boolean
  showControls?: boolean
  showHint?: boolean
  mode?: 'view' | 'edit' | 'preview'
  inlineEditable?: boolean
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
  
  if (timeSinceLastClick < CLICK_DELAY) {
    clearClickTimeout()
    return
  }
  
  lastClickTime.value = now
  
  if (!props.editable) {
    clickTimeout.value = window.setTimeout(handleFlip, CLICK_DELAY)
  }
}

function onDoubleClick() {
  clearClickTimeout()
}

// Flip handling
function handleFlip() {
  if (isFlipping.value || isNavigating.value) return
  
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
})

onUnmounted(() => {
  clearTimeouts()
  const element = document.querySelector('.flashcard-scaffold')
  if (element) {
    element.removeEventListener('touchmove', () => {})
  }
})
</script>

<style scoped>
.flashcard-scaffold {
  touch-action: pan-y pinch-zoom;
  user-select: text; /* Changed from none to allow text selection */
  -webkit-user-select: text;
  -webkit-touch-callout: default;
  border-radius: 1rem;
  width: 100%;
  height: 400px;
  transition: transform 0.3s ease;
  background: white;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
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
  user-select: text; /* Explicitly allow text selection */
}

.card-content {
  position: relative;
  width: 100%;
  height: 100%;
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
  overflow: hidden;
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
  padding: 2rem;
}

.card-face .formatted-content img,
.card-face .formatted-content iframe {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* Add focus styles for better accessibility */
.flashcard-scaffold:focus {
  outline: 2px solid #2563eb;
  outline-offset: 2px;
}

/* Add hover effect for better interactivity */
.flashcard-scaffold:not(.editable):hover {
  box-shadow: 0 6px 8px -1px rgb(0 0 0 / 0.15), 0 3px 6px -3px rgb(0 0 0 / 0.15);
}
</style>
