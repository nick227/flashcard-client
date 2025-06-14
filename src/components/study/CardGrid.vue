<template>
  <div class="grid-view" ref="gridViewRef">
    <div v-for="card in cards" :key="getCardId(card)" class="card">
      <FlashCardScaffold 
        :card="card" 
        :editable="false"
        :flipped="gridCardStates[getCardId(card)]"
        size="small"
        @flip="(isFlipped) => $emit('card-flip', getCardId(card), isFlipped)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import FlashCardScaffold from '@/components/common/FlashCardScaffold.vue'
import type { Card } from '@/types/card'

defineProps<{
  cards: Card[]
  gridCardStates: Record<number, boolean>
}>()

defineEmits<{
  (e: 'card-flip', cardId: number, isFlipped: boolean): void
}>()

// Helper function to safely get card ID
function getCardId(card: Card): number {
  if (typeof card.id !== 'number') {
    throw new Error('Card ID must be a number')
  }
  return card.id
}
</script>

<style scoped>
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;
  justify-items: center;
  align-items: stretch;
}

.card-content {
  width: calc(100% - 2rem);
  padding: 1rem;
}

@media (max-width: 768px) {
  .grid-view {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
  .card-face, .formatted-content {
    font-size: 12px !important;
  }
  .card-content {
    max-height: 160px;
  }
  .grid-view .card {
    max-height: 180px;
  }
}
</style> 