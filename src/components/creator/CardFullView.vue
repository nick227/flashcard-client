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
      <CardEditor
        v-if="!previewMode"
        :card="localCard"
        :auto-focus="autoFocus"
        @update="onCardUpdate"
      />
      <!-- Preview mode: show card scaffold component -->
      <FlashCardScaffold
        v-else
        :card="localCard"
        :flipped="flipped"
        :editable="false"
        :inline-editable="true"
        @update:card="onInlineEdit"
        @flip="handleFlip"
      />
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
import { ref, watch, computed } from 'vue'
import FlashCardScaffold from '@/components/common/FlashCardScaffold.vue'
import CardEditor from '@/components/creator/CardEditor.vue'
import type { Card } from '@/types/card'

// --- Props and Emits ---
const props = defineProps<{ card: Card, autoFocus?: boolean }>()
const emit = defineEmits(['update-card', 'delete-card', 'request-delete'])

// --- Local State ---
const localCard = ref({ ...props.card })
const previewMode = ref(false)
const flipped = ref(false)
const isFlipping = ref(false)
const isNavigating = ref(false)
const touchedFront = ref(false)
const touchedBack = ref(false)

// --- Computed ---
const isBlank = computed(() => {
  return (!localCard.value.front.text && !localCard.value.front.imageUrl) || 
         (!localCard.value.back.text && !localCard.value.back.imageUrl)
})

// --- Watchers ---
watch(() => props.card, (newCard) => {
  if (JSON.stringify(newCard) !== JSON.stringify(localCard.value)) {
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
  }
}, { deep: true })

watch([() => props.card, previewMode], ([newCard, mode], [oldCard]) => {
  if (mode === false || newCard?.id !== oldCard?.id) {
    isNavigating.value = true
    flipped.value = false
    isFlipping.value = false
    setTimeout(() => { isNavigating.value = false }, 50)
  }
})

// --- Handlers ---
const emitUpdate = () => {
  emit('update-card', { ...localCard.value })
}

const onCardUpdate = (updatedCard: Card) => {
  localCard.value = { ...updatedCard }
  emitUpdate()
}

const onInlineEdit = (updatedCard: Card) => {
  localCard.value = { ...updatedCard }
  emitUpdate()
}

const onRequestDelete = () => emit('request-delete', localCard.value.id)

const handleFlip = (newFlippedState: boolean) => {
  if (isFlipping.value || isNavigating.value) return
  isFlipping.value = true
  flipped.value = newFlippedState
  setTimeout(() => { isFlipping.value = false }, 300)
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
</style>