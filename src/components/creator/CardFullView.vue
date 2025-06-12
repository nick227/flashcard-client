<template>
  <div class="card-full-view bg-gray-50 rounded-xl p-6 mb-4" :class="{ 'card-success': !isBlank }">
    <!-- Top action buttons: Delete and Preview toggle -->
    <div class="flex justify-between items-center mb-3">
      <button class="button button-danger button-icon text-xs px-3 py-1" @click="onRequestDelete">
        <i class="fa-solid fa-trash"></i>
      </button>
      <button class="button button-accent text-xs px-3 py-1" @click="previewMode = !previewMode">
        {{ previewMode ? 'Back to Edit' : 'Preview' }}
      </button>
    </div>
    <div class="card-container">
      <!-- Edit mode: show editable front/back fields -->
      <CardEditor
        v-if="!previewMode"
        :card="localCard"
        :title="props.title || ''"
        :description="props.description || ''"
        :category="props.category || ''"
        @update="onEditCard"
      />
      <!-- Preview mode: show card scaffold component -->
      <div v-else class="card-preview">
        <FlashCardScaffold
          :card="localCard"
          :flipped="flipped"
          mode="preview"
          :title="props.title || ''"
          :description="props.description || ''"
          :category="props.category || ''"
        />
        <button class="flip-button" @click="handleFlip">
          <i class="fa-solid fa-rotate"></i>
        </button>
      </div>
    </div>
    <!-- Error message if front or back is blank -->
    <div v-if="isBlank && (touchedFront || touchedBack)" class="text-red-500 text-xs mt-2">
      Front and back are required.
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { FlashCard } from '@/types/card'
import CardEditor from '@/components/creator/CardEditor.vue'
import FlashCardScaffold from '@/components/common/FlashCardScaffold.vue'
import type { CardViewMode } from '@/composables/useCardMediaStyles'

const props = defineProps<{
  card: FlashCard
  viewMode?: CardViewMode
  mode?: 'single' | 'multiple'
  autoFocus?: boolean
  autoFocusId?: number | null
  title?: string
  description?: string
  category?: string
}>()

const emit = defineEmits(['update', 'delete', 'request-delete'])

// Local state
const localCard = ref({ ...props.card })
const previewMode = ref(false)
const flipped = ref(false)
const touchedFront = ref(false)
const touchedBack = ref(false)

// Computed
const isBlank = computed(() => {
  return (!localCard.value.front.text && !localCard.value.front.imageUrl) || 
         (!localCard.value.back.text && !localCard.value.back.imageUrl)
})

// Log initial props
console.log('CardFullView - Component created with props:', {
  card: props.card,
  viewMode: props.viewMode,
  mode: props.mode,
  autoFocus: props.autoFocus,
  autoFocusId: props.autoFocusId,
  front: {
    text: props.card.front.text,
    imageUrl: props.card.front.imageUrl
  },
  back: {
    text: props.card.back.text,
    imageUrl: props.card.back.imageUrl
  }
})

// Watch for card changes
watch(() => props.card, (newCard) => {
  console.log('CardFullView - Card updated:', {
    front: {
      text: newCard.front.text,
      imageUrl: newCard.front.imageUrl
    },
    back: {
      text: newCard.back.text,
      imageUrl: newCard.back.imageUrl
    }
  })
  localCard.value = { ...newCard }
}, { deep: true })

function onEditCard(updatedCard: FlashCard) {
  localCard.value = { ...updatedCard }
  emitUpdate()
}

const emitUpdate = () => {
  emit('update', { ...localCard.value })
}

const handleFlip = () => {
  flipped.value = !flipped.value
}

const onRequestDelete = () => {
  console.log('CardFullView - Delete requested for card:', localCard.value.id)
  emit('request-delete', localCard.value.id)
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
  display: flex;
  flex-direction: column;
  height: 100%;
  align-items: center;
}

.flip-button {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.flip-button:hover {
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.button {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.button-icon {
  padding: 0.25rem;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-danger {
  background: transparent;
  color: white;
}

.button-accent {
  background: #3b82f6;
  color: white;
}

.button:hover {
  opacity: 0.9;
}

.input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 0.875rem;
}

.input:focus {
  outline: none;
  border-color: #2563eb;
}

.text-red-500 {
  color: #ef4444;
}

.text-xs {
  font-size: 0.75rem;
}

.mt-2 {
  margin-top: 0.5rem;
}
</style>