<template>
  <div class="draggable-card-list" :class="layout">
    <draggable
      v-model="localCards"
      :animation="150"
      item-key="id"
      handle=".drag-handle"
      @start="drag = true"
      @end="drag = false"
      @update:model-value="onUpdateOrder"
    >
      <template #item="{ element: card }">
        <div class="card-wrapper">
          <component
            :is="cardComponent"
            :card="card"
            v-bind="cardProps"
            @update="(updatedCard: FlashCard) => onEditCard(updatedCard)"
            @delete="() => onDeleteCard(card.id)"
            @request-delete="() => onRequestDelete(card.id)"
          />
        </div>
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'
import type { FlashCard } from '@/types/card'
import type { CardViewMode } from '@/composables/useCardMediaStyles'

const props = defineProps<{
  cards: FlashCard[]
  cardComponent: any
  layout?: 'grid' | 'list'
  viewMode?: CardViewMode
  cardProps?: Record<string, any>
}>()

const emit = defineEmits(['update-order', 'delete-card', 'edit-card', 'request-delete'])

const localCards = ref<FlashCard[]>([])
const drag = ref(false)

// Watch for cards changes
watch(() => props.cards, (newCards) => {
  localCards.value = [...newCards]
}, { deep: true, immediate: true })

const onUpdateOrder = (newOrder: FlashCard[]) => {
  emit('update-order', newOrder)
}

const onEditCard = (updatedCard: FlashCard) => {
  emit('edit-card', updatedCard)
}

const onDeleteCard = (id: number) => {
  emit('delete-card', id)
}

const onRequestDelete = (id: number) => {
  emit('request-delete', id)
}
</script>

<style scoped>
.draggable-card-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
}

.draggable-card-list.grid,
.draggable-card-list.grid > div {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
  width: 100%;
}

.card-wrapper {
  position: relative;
  width: 100%;
  min-height: 300px;
  aspect-ratio: 16/9;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.card-wrapper:hover {
  transform: scale(1.02);
}

.drag-handle {
  cursor: move;
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  opacity: 0.5;
  transition: opacity 0.2s;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.5rem;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.drag-handle:hover {
  opacity: 1;
}

@media (max-width: 768px) {
  .draggable-card-list.grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .card-wrapper {
    min-height: 250px;
  }
}
</style> 