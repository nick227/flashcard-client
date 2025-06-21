<template>
  <div class="card-tile" :class="{ 'is-flipped': isFlipped }">
    <div class="drag-handle">
      <i class="fa-solid fa-grip-vertical"></i>
    </div>
    <div class="card-content" :class="{ 'is-flipped': isFlipped }" @click="toggleFlip">
      <FlashCardScaffold
        :card="card"
        :editable="isEditing"
        :flipped="isFlipped"
        size="small"
        @update="handleUpdate"
        @edit-start="$emit('edit-start')"
        @edit-end="$emit('edit-end')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Card } from '@/types/card'
import FlashCardScaffold from '@/components/common/FlashCardScaffold.vue'
import type { CardViewMode } from '@/composables/useCardMediaStyles'

defineProps<{
  card: Card
  viewMode?: CardViewMode
  isEditing?: boolean
}>()

const emit = defineEmits<{
  (e: 'update', card: Card): void
  (e: 'delete'): void
  (e: 'request-delete'): void
  (e: 'edit-start'): void
  (e: 'edit-end'): void
}>()

const isFlipped = ref(false)

function toggleFlip() {
  isFlipped.value = !isFlipped.value
}

const handleUpdate = (updatedCard: Card) => {
  emit('update', updatedCard)
}
</script>

<style scoped>
.card-tile {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 200px;
  background: var(--color-background);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: transform 0.3s ease;
}

.drag-handle {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.5rem;
  cursor: move;
  color: var(--color-text-light);
  z-index: 10;
}

.card-content {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
}

.card-content.is-flipped {
  transform: rotateY(180deg);
}
</style> 