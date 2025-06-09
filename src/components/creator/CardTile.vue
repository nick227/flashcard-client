<template>
  <div class="card-tile bg-white rounded-xl flex flex-col items-stretch h-full">
    
    <div class="flex justify-between mb-4 button-row">
      <button class="button button-danger button-icon text-xs px-3 py-1 mr-2" @click="onRequestDelete"><i class="fa-solid fa-trash"></i></button>
      <button class="button button-accent text-xs px-3 py-1" @click="onRequestPreview">
        {{ previewMode ? 'Back to Edit' : 'Preview' }}
      </button>
    </div>

    <div class="tile-content flex-1 flex flex-col min-h-0" v-if="!previewMode">
      <label class="block text-gray-500 text-xs mb-1">Front</label>
      <CardContent
        :text="localCard.front.text"
        :imageUrl="localCard.front.imageUrl"
        mode="edit"
        viewMode="tile"
        @update="onFrontUpdate"
      />
      <label class="block text-gray-500 text-xs mb-1">Back</label>
      <CardContent
        :text="localCard.back.text"
        :imageUrl="localCard.back.imageUrl"
        mode="edit"
        viewMode="tile"
        @update="onBackUpdate"
      />
      <label class="block text-gray-500 text-xs mb-1">Hint</label>
      <textarea class="input flex-shrink-0" v-model="localCard.hint" @input="emitUpdate" placeholder="Hint..."></textarea>
    </div>
    <template v-else>
      <div class="tile-preview flex-1 flex items-stretch justify-stretch min-h-0">
        <FlashCardScaffold 
          :card="localCard" 
          :flipped="flipped" 
          :editable="false" 
          :inlineEditable="true"
          @update:card="onInlineEdit" 
          @flip="handleFlip"
          class="w-full h-full preview-scaffold"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import type { Card } from '@/types/card'
import FlashCardScaffold from '@/components/common/FlashCardScaffold.vue'
import CardContent from '@/components/common/CardContent.vue'

const props = defineProps<{ card: Card }>()
const emit = defineEmits(['update-card', 'delete-card', 'request-delete'])
const localCard = ref({ ...props.card })
const previewMode = ref(false)
const flipped = ref(false)
const isFlipping = ref(false)

// Update watch to handle deep changes
watch(() => props.card, (val) => { 
  localCard.value = { ...val }
}, { deep: true })

function emitUpdate() {
  emit('update-card', { ...localCard.value })
}

// Add immediate update on mount
onMounted(() => {
  emitUpdate()
})

function onRequestDelete() {
  emit('request-delete', localCard.value.id)
}

function onRequestPreview() {
  previewMode.value = !previewMode.value
  if (!previewMode.value) {
    flipped.value = false
  }
}

function onInlineEdit(updatedCard: Card) {
  localCard.value = { ...updatedCard }
  emitUpdate()
}

function handleFlip(newFlippedState: boolean) {
  if (isFlipping.value) return
  isFlipping.value = true
  flipped.value = newFlippedState
  setTimeout(() => { isFlipping.value = false }, 300)
}

const onFrontUpdate = (text: string) => {
  localCard.value.front.text = text
  emitUpdate()
}

const onBackUpdate = (text: string) => {
  localCard.value.back.text = text
  emitUpdate()
}
</script>

<style scoped>
.card-tile {
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 1.25rem;
  box-shadow: 0 4px 24px 0 rgba(30,41,59,0.08);
  min-height: 460px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
  transition: all 0.3s ease;
  padding: 1rem;
  box-sizing: border-box;
}

.tile-content, .tile-preview {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.button-row {
  margin-top: auto;
}

.tile-preview {
  align-items: stretch;
  justify-content: stretch;
  padding: 0;
}

.preview-scaffold {
  border-radius: 1.25rem;
  box-shadow: none;
  height: 100%;
  min-height: 200px;
  box-sizing: border-box;
}

.card-tile .card-content {
  padding: 1rem;
  width: calc(100% - 2rem);
}
</style> 