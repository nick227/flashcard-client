<template>
  <div class="grid-view" ref="gridViewRef">
    <div v-for="card in cards" :key="card.id" class="card">
      <FlashCardScaffold 
        :card="card" 
        :editable="false"
        :flipped="gridCardStates[card.id]"
        @flip="(isFlipped) => $emit('card-flip', card.id, isFlipped)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import FlashCardScaffold from '@/components/common/FlashCardScaffold.vue'
import type { FlashCard } from '@/types'

defineProps<{
  cards: FlashCard[]
  gridCardStates: Record<number, boolean>
}>()

defineEmits<{
  (e: 'card-flip', cardId: number, isFlipped: boolean): void
}>()
</script>

<style scoped>
.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
  width: 100%;
  margin-top: 1rem;
}
</style> 