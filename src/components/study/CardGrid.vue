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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  width: 100%;
  margin-top: 1rem;
  justify-items: center;
  align-items: stretch;
  padding: 1rem;
}

.card {
  width: 100%;
  min-height: 300px;
  aspect-ratio: 16/9;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.card:hover {
  transform: scale(1.02);
}

.card-content {
  width: 100%;
  height: 100%;
  padding: 1rem;
  box-sizing: border-box;
}

@media (max-width: 768px) {
  .grid-view {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .card {
    min-height: 250px;
  }
  
  .card-face, .formatted-content {
    font-size: 12px !important;
  }
}
</style> 