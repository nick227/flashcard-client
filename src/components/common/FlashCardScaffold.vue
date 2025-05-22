<template>
  <div
    class="flashcard-scaffold card flex flex-col items-center justify-center w-full max-w-3xl mx-auto relative"
    :tabindex="editable ? -1 : 0"
    :aria-label="editable ? 'Edit flash card' : 'Flash card'"
    @click="onCardClick"
    @keydown.space.prevent="!editable && emit('flip', !(props.flipped ?? false))"
    @keydown.enter.prevent="!editable && emit('flip', !(props.flipped ?? false))"
    :style="{ cursor: editable ? 'default' : 'pointer' }"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
  >
    <div class="card-content" :class="{ 'is-flipped': isFlipped }">
      <div class="card-face front">
        <div class="text-2xl font-semibold formatted-content" v-html="card?.front || 'No front content'"></div>
      </div>
      <div class="card-face back">
        <div class="text-2xl font-semibold formatted-content" v-html="card?.back || 'No back content'"></div>
      </div>
    </div>
    <slot name="controls"></slot>
    <button v-if="editable && showControls" class="button button-danger absolute top-4 right-4 z-10" @click.stop="$emit('delete')">Delete</button>
    <div v-if="showHint && card?.hint" class="hint-text text-base text-gray-700 mt-4 w-full text-left px-2" v-html="card.hint"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'

interface FlashCard {
  id: number
  front: string
  back: string
  hint?: string
  setId: number
}

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

const localFlipped = ref(false)

// Computed properties
const isFlipped = computed(() => {
  return props.flipped !== undefined ? props.flipped : localFlipped.value
})

const isFullscreen = computed(() => document.fullscreenElement !== null)

// Methods
function onCardClick(e: MouseEvent) {
  if (!props.editable) {
    if (props.flipped !== undefined) {
      emit('flip', !props.flipped)
    } else {
      localFlipped.value = !localFlipped.value
      emit('flip', localFlipped.value)
    }
  }
}

// Swipe gestures
const touchStartX = ref(0)
const touchStartY = ref(0)
const isSwiping = ref(false)
const swipeThreshold = 50

const isHorizontalSwipe = (diffX: number, diffY: number): boolean => {
  return Math.abs(diffX) > Math.abs(diffY)
}

const handleSwipeEnd = (diffX: number, diffY: number) => {
  if (Math.abs(diffX) > swipeThreshold && isHorizontalSwipe(diffX, diffY)) {
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

// Simplified touch handling
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
  const element = document.querySelector('.flashcard-scaffold')
  if (element) {
    element.removeEventListener('touchmove', () => {})
  }
})

const exitFullscreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  }
}

</script>

<style scoped>
.flashcard-scaffold {
  touch-action: pan-y pinch-zoom;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  border-radius: 1rem;
  width: 100%;
  height: 400px;
  transition: transform 0.3s ease;
  background: white;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  position: relative;
  perspective: 1000px;
}

.fullscreen .flashcard-scaffold {
  height: 100%;
}

.flashcard-scaffold:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}

.card-content {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.card-content.is-flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}

.front {
  transform: rotateY(0deg);
}

.back {
  transform: rotateY(180deg);
}

.formatted-content {
  text-align: center;
  padding: 1rem;
  width: 100%;
  max-width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Debug info */
.debug-info {
  position: absolute;
  top: -20px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 12px;
  color: #666;
}
</style>
