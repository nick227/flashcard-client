<template>
  <div class="card-tile" :class="{ 'is-flipped': isFlipped }">
    <div class="drag-handle">
      <i class="fa-solid fa-grip-vertical"></i>
    </div>
    <div class="card-content" @click="toggleFlip">
        <FlashCardScaffold
          :card="card"
          :flipped="isFlipped"
          mode="preview"
          :title="card.title || ''"
          :description="card.description || ''"
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
  title?: string
  description?: string
  category?: string
  onImageFile?: (data: { file: File, side: 'front' | 'back' }) => void
  onHintUpdate?: (hint: string) => void
}>()

const isFlipped = ref(false)

function toggleFlip() {
  isFlipped.value = !isFlipped.value
}

</script>

<style scoped>
.card-tile {
  position: relative;
  width: 100%;
  height: 260px;
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