<template>
  <div class="card-full-view bg-gray-50 rounded-xl shadow p-6 mb-4" :class="{ 'card-success': !isBlank }">
    <div class="flex justify-between items-center mb-3">
      <button class="button button-danger text-xs px-3 py-1" @click="onRequestDelete">Delete</button>
      <button class="button button-accent text-xs px-3 py-1" @click="previewMode = !previewMode">
        {{ previewMode ? 'Back to Edit' : 'Preview' }}
      </button>
    </div>
    <div class="card-container">
      <div v-if="!previewMode" class="flex gap-4 items-start">
        <div class="flex-1 card-col" style="min-width:0">
          <label class="block text-gray-500 text-xs mb-1">Front</label>
          <div class="card-preview front">
            <div
              ref="frontRef"
              class="card-content"
              :class="{ 'input-error': !localCard.front.trim() && touchedFront }"
              contenteditable="true"
              @input="onFrontInput"
              @focus="focusedField = 'front'"
              @blur="touchedFront = true; focusedField = null"
              @keydown.tab.prevent="focusBack"
              :data-placeholder="'Front text...'"
              :style="{ fontSize: getFontSize(localCard.front) }"
            ></div>
          </div>
        </div>
        <div class="flex-1 card-col" style="min-width:0">
          <label class="block text-gray-500 text-xs mb-1">Back</label>
          <div class="card-preview back">
            <div
              ref="backRef"
              class="card-content"
              :class="{ 'input-error': !localCard.back.trim() && touchedBack }"
              contenteditable="true"
              @input="onBackInput"
              @focus="focusedField = 'back'"
              @blur="touchedBack = true; focusedField = null"
              @keydown.shift.tab.prevent="focusFront"
              :data-placeholder="'Back text...'"
              :style="{ fontSize: getFontSize(localCard.back) }"
            ></div>
          </div>
        </div>
      </div>
      <div v-else>
        <FlashCardScaffold :card="localCard" :flipped="flipped" :editable="false" :inlineEditable="true" @update:card="onInlineEdit" @flip="flipped = $event" />
      </div>
    </div>
    <div class="mt-3">
      <input type="text" class="input w-full" v-model="localCard.hint" @input="emitUpdate" placeholder="Hint..." />
    </div>
    <div v-if="isBlank && (touchedFront || touchedBack)" class="text-red-500 text-xs mt-2">Front and back are required.</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import FlashCardScaffold from '@/components/common/FlashCardScaffold.vue'

type Flashcard = {
  id: number
  front: string
  back: string
  hint?: string
  setId: number
}

const props = defineProps<{ card: Flashcard, autoFocus?: boolean }>()
const emit = defineEmits(['update-card', 'delete-card', 'request-delete'])

const localCard = ref({ ...props.card })
watch(() => props.card, (newCard) => {
  localCard.value = { ...newCard }
}, { immediate: true })

function emitUpdate() {
  emit('update-card', { ...localCard.value })
}

const frontRef = ref()
const backRef = ref()
const focusedField = ref<string | null>(null)
const touchedFront = ref(false)
const touchedBack = ref(false)
const previewMode = ref(false)
const flipped = ref(false)

function getFontSize(text: string): string {
  const length = text.length
  if (length > 500) return '1.4rem'
  if (length > 300) return '1.8rem'
  if (length > 150) return '2rem'
  return '2.2rem'
}

function onFrontInput(e: Event) {
  const target = e.target as HTMLElement
  localCard.value.front = target.textContent || ''
  adjustCardHeight(target)
  emitUpdate()
}

function onBackInput(e: Event) {
  const target = e.target as HTMLElement
  localCard.value.back = target.textContent || ''
  adjustCardHeight(target)
  emitUpdate()
}

function adjustCardHeight(element: HTMLElement) {
  const cardPreview = element.closest('.card-preview')
  if (!cardPreview) return

  const isOverflowing = element.scrollHeight > element.clientHeight
  if (isOverflowing) {
    cardPreview.style.height = `${element.scrollHeight + 80}px` // 40px top + 40px bottom
  } else {
    cardPreview.style.height = '400px' // Reset to default height
  }
}

function focusBack() {
  nextTick(() => backRef.value?.focus())
}

function focusFront() {
  nextTick(() => frontRef.value?.focus())
}

function onRequestDelete() {
  emit('request-delete', localCard.value.id)
}

function onInlineEdit(updated: Flashcard) {
  localCard.value = { ...updated }
  emitUpdate()
}

const isBlank = computed(() => !localCard.value.front.trim() || !localCard.value.back.trim())

// Auto-focus front field if prop is set
watch(() => props.autoFocus, (val) => {
  if (val) nextTick(() => frontRef.value?.focus())
}, { immediate: true })

// Reset flip when switching cards or exiting preview
watch([() => props.card, previewMode], ([newCard, mode], [oldCard, oldMode]) => {
  if (mode === false || newCard?.id !== oldCard?.id) {
    flipped.value = false
  }
})
</script>

<style scoped>
.card-full-view {
  background: #f8fafc;
  border: 1.5px solid #e5e7eb;
  border-radius: 1.25rem;
  box-shadow: 0 4px 24px 0 rgba(30,41,59,0.08);
  transition: box-shadow 0.18s, border-color 0.18s;
  box-sizing: border-box;
  width: 96%;
}

.card-col {
  width: calc(50% - 0.5rem); /* gap-4 is 1rem, so each side gets half the gap */
  min-width: 0;
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
}

.card-preview {
  min-height: 400px;
  height: 400px;
  border-radius: 1.5rem;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  width: 100%;
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
  padding: 2.5rem;
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
</style> 