<template>
  <div
    class="flashcard-scaffold card flex flex-col items-center justify-center w-full mx-auto relative"
    :class="{ small: size === 'small', editable: editable }"
    :tabindex="editable ? -1 : 0"
    :aria-label="editable ? 'Edit flash card' : 'Flash card'"
    @click="handleCardClick"
    @dblclick="handleDoubleClick"
    @keydown.space.prevent="!editable && handleCardClick()"
    @keydown.enter.prevent="!editable && handleCardClick()"
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
          :side="'front'"
          :is-editing="editable"
          @update="updateFront"
          @edit-start="$emit('edit-start')"
          @edit-end="$emit('edit-end')"
        />
      </div>
      <div v-show="isFlipped" class="card-face back">
        <CardContent 
          :card="card"
          :side="'back'"
          :is-editing="editable"
          @update="updateBack"
          @edit-start="$emit('edit-start')"
          @edit-end="$emit('edit-end')"
        />
      </div>
    </div>
    <slot name="controls"></slot>
    <button v-if="editable && showControls" class="button button-danger button-icon absolute top-4 right-4 z-10" @click.stop="$emit('delete')"><i class="fa-solid fa-trash"></i></button>
    <div v-if="showHint && card?.hint" class="hint-text text-base text-gray-700 mt-4 w-full text-left px-2">{{ card.hint }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onUnmounted, watch } from 'vue'
import type { Card } from '@/types/card'
import CardContent from './CardContent.vue'
import { useGestureHandling } from '@/composables/useGestureHandling'

const props = defineProps<{
  card: Card
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
  swipeThreshold?: number
}>()

const emit = defineEmits<{
  (e: 'update', card: Card): void
  (e: 'edit-start'): void
  (e: 'edit-end'): void
  (e: 'flip', value: boolean): void
  (e: 'delete'): void
  (e: 'next'): void
  (e: 'prev'): void
}>()

// State management
const localFlipped = ref(props.flipped || false)

// Track all blob URLs for cleanup
const blobUrls = ref<Set<string>>(new Set())

// Computed properties
const isFlipped = computed(() => props.flipped !== undefined ? props.flipped : localFlipped.value)

// Gesture handling
const {
  isFlipping,
  handleCardClick,
  handleDoubleClick,
  onTouchStart,
  onTouchEnd,
  onMouseDown,
  onMouseUp,
  resetState
} = useGestureHandling(
  {
    onFlip: () => {
      const newFlippedState = !isFlipped.value
      if (props.flipped !== undefined) {
        emit('flip', newFlippedState)
      } else {
        localFlipped.value = newFlippedState
        emit('flip', localFlipped.value)
      }
    },
    onNext: () => emit('next'),
    onPrev: () => emit('prev')
  },
  {
    editable: props.editable,
    swipeThreshold: props.swipeThreshold || 30,
    clickDelay: 300,
    flipAnimationDuration: 300
  }
)

// Add debug logging
watch(() => props.card, () => {
}, { immediate: true })

// Reset flip state when card changes
watch(() => props.card, () => {
  resetState()
  localFlipped.value = false
})

// Cleanup blob URLs when component is unmounted
onUnmounted(() => {
  // Revoke all tracked blob URLs to prevent memory leaks
  blobUrls.value.forEach(url => {
    URL.revokeObjectURL(url)
  })
  blobUrls.value.clear()
})

function updateFront(card: Card) {
  emit('update', card)
}

function updateBack(card: Card) {
  emit('update', card)
}
</script>

<style scoped>
.flashcard-scaffold {
  touch-action: pan-x pan-y pinch-zoom;
  user-select: text; /* Changed from none to allow text selection */
  -webkit-user-select: text;
  -webkit-touch-callout: default;
  border-radius: 1rem;
  width: 100%;
  min-height: 400px;
  transition: transform 0.3s ease, box-shadow 0.2s ease;
  background: white;
  position: relative;
  perspective: 1000px;
  will-change: transform; /* Performance optimization */
  cursor: pointer; /* Show it's interactive */
}

/* Remove hover effects in edit mode */
.flashcard-scaffold.editable {
  cursor: default;
}

.flashcard-scaffold.editable:hover {
  box-shadow: none;
  transform: none;
}

.flashcard-scaffold.editable:hover::before {
  display: none;
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
