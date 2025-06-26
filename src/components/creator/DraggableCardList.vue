<template>
  <div class="card-list" :class="layout">
    <draggable
      v-model="localCards"
      :disabled="isEditing"
      item-key="id"
      @start="drag = true"
      @end="drag = false"
      @update:model-value="onUpdateOrder"
    >
      <template #item="{ element: card }">
        <component
          :is="cardComponent"
          :card="card"
          :is-editing="true"
          v-bind="cardProps"
          @update="onCardUpdate"
          @delete="onCardDelete"
          @request-delete="onRequestDelete"
          @edit-start="$emit('edit-start')"
          @edit-end="$emit('edit-end')"
        />
      </template>
    </draggable>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Card } from '@/types/card'
import draggable from 'vuedraggable'

const props = defineProps<{
  cards: Card[]
  cardComponent: any
  layout?: 'grid' | 'list'
  cardProps?: Record<string, any>
}>()

const emit = defineEmits<{
  (e: 'update-order', cards: Card[]): void
  (e: 'delete-card', index: number): void
  (e: 'edit-card', card: Card): void
  (e: 'request-delete', cardId: number): void
  (e: 'edit-start'): void
  (e: 'edit-end'): void
}>()

const localCards = ref<Card[]>(props.cards)
const drag = ref(false)
const isEditing = ref(false)

watch(() => props.cards, (newCards) => {
  localCards.value = newCards
}, { deep: true })

function onUpdateOrder(newOrder: Card[]) {
  emit('update-order', newOrder)
}

function onCardUpdate(updatedCard: Card) {
  const index = localCards.value.findIndex(c => c.id === updatedCard.id)
  if (index !== -1) {
    localCards.value[index] = updatedCard
    emit('edit-card', updatedCard)
  }
}

function onCardDelete(index: number) {
  emit('delete-card', index)
}

function onRequestDelete(cardId: number) {
  emit('request-delete', cardId)
}
</script>

<style scoped>
.card-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  width: 100%;
}

.card-list.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--space-md);
}

@media (max-width: 600px) {
  .card-list.grid {
    grid-template-columns: 1fr;
  }
}
</style> 