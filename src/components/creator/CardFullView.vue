<template>
  <div class="card-full-view bg-gray-50 rounded-xl shadow p-6 w-full mb-4" :class="{ 'card-success': !isBlank }">
    <div class="flex justify-between items-center mb-3">
      <button class="button button-danger text-xs px-3 py-1" @click="onRequestDelete">Delete</button>
    </div>
    <div v-if="!previewMode">
      <div class="flex gap-4 items-start">
        <div class="flex-1">
          <label class="block text-gray-500 text-xs mb-1">Front</label>
          <textarea
            ref="frontRef"
            class="input w-full large"
            :class="{ 'input-error': !localCard.front.trim() && touchedFront }"
            v-model="localCard.front"
            @input="emitUpdate"
            @focus="focusedField = 'front'"
            @blur="touchedFront = true; focusedField = null"
            @keydown.tab.prevent="focusBack"
            :autofocus="autoFocus"
            placeholder="Front text..."
          ></textarea>
        </div>
        <div class="flex-1">
          <label class="block text-gray-500 text-xs mb-1">Back</label>
          <textarea
            ref="backRef"
            class="input w-full large"
            :class="{ 'input-error': !localCard.back.trim() && touchedBack }"
            v-model="localCard.back"
            @input="emitUpdate"
            @focus="focusedField = 'back'"
            @blur="touchedBack = true; focusedField = null"
            @keydown.shift.tab.prevent="focusFront"
            placeholder="Back text..."
          ></textarea>
        </div>
      </div>
      <div class="flex items-center gap-4 mt-3">
        <button class="button button-accent text-xs px-3 py-1" @click="previewMode = true">Preview</button>
        <input type="text" class="input w-full" v-model="localCard.hint" @input="emitUpdate" placeholder="Hint..." />
      </div>
    </div>
    <div v-else>
      <FlashCardScaffold :card="localCard" :flipped="flipped" :editable="false" :inlineEditable="true" @update:card="onInlineEdit" @flip="flipped = $event" />
      <div class="flex items-center gap-4 mt-3">
        <button class="button button-accent text-xs px-3 py-1" @click="exitPreview">Back to Edit</button>
      </div>
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
watch(() => props.card, (val) => { localCard.value = { ...val } })

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

function focusBack() {
  nextTick(() => backRef.value?.focus())
}
function focusFront() {
  nextTick(() => frontRef.value?.focus())
}
function onRequestDelete() {
  emit('request-delete', localCard.value.id)
}
function exitPreview() {
  previewMode.value = false
  flipped.value = false
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
}
.card-full-view:focus-within {
  box-shadow: 0 0 0 2px #2563eb33;
  border-color: #2563eb;
}
.card-error {
  border-color: #ef4444 !important;
}
</style> 