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
import { ref, watch, onMounted } from 'vue'
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

// Log initial props
console.log('DraggableCardList - Component created with props:', {
  cards: props.cards,
  layout: props.layout,
  viewMode: props.viewMode,
  cardComponent: props.cardComponent
})

// Watch for cards changes
watch(() => props.cards, (newCards) => {
  console.log('DraggableCardList - Cards updated:', newCards)
  localCards.value = [...newCards]
}, { deep: true, immediate: true })

onMounted(() => {
  console.log('DraggableCardList - Component mounted:', {
    cards: props.cards,
    layout: props.layout,
    viewMode: props.viewMode,
    cardComponent: props.cardComponent,
    localCards: localCards.value
  })
})

const onUpdateOrder = (newOrder: FlashCard[]) => {
  console.log('DraggableCardList - Order updated:', newOrder)
  emit('update-order', newOrder)
}

const onEditCard = (updatedCard: FlashCard) => {
  console.log('DraggableCardList - Card edited:', updatedCard)
  emit('edit-card', updatedCard)
}

const onDeleteCard = (id: number) => {
  console.log('DraggableCardList - Card deleted:', id)
  emit('delete-card', id)
}

const onRequestDelete = (id: number) => {
  console.log('DraggableCardList - Card delete requested:', id)
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

.draggable-card-list.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.card-wrapper {
  position: relative;
  width: 100%;
  min-height: 200px;
}

.drag-handle {
  cursor: move;
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.drag-handle:hover {
  opacity: 1;
}
</style> 