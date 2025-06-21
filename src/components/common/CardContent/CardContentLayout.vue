<template>
  <div class="card-content-layout" :class="[layout, side, { 'mobile': isMobile }]">
    <div v-for="(cell, index) in cells" :key="`${layout}-${index}-${cell.type}`" class="content-area">
      <CardContentCell 
        :cell="cell" 
        :index="index"
        :is-mobile="isMobile"
        :is-editing="isEditing"
        :show-media-controls="isEditing"
        @update="(i, updates) => $emit('update', i, updates)"
        @remove="(i) => $emit('remove', i)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CardLayout, CardSide, ContentCell } from '@/types/card'
import CardContentCell from './CardContentCell.vue'

defineProps<{
  layout: CardLayout
  side: CardSide
  cells?: ContentCell[]
  isMobile?: boolean
  isEditing?: boolean
}>()

defineEmits<{
  (e: 'update', index: number, updates: Partial<ContentCell>): void
  (e: 'remove', index: number): void
}>()
</script>

<style scoped>
.card-content-layout {
  display: flex;
  width: 100%;
  height: 100%;
  padding: var(--space-md);
  box-sizing: border-box;
  border-radius: var(--radius-lg);
  position: relative;
}

.content-area {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}

/* Layout styles */
.default {
  flex-direction: column;
  gap: var(--space-md);
}

.default .content-area {
  width: 100%;
  height: 100%;
  min-height: 100px;
}

.two-col {
  flex-direction: row;
  gap: var(--space-md);
}

.two-col .content-area {
  width: 50%;
  height: 100%;
  min-height: 100px;
}

.two-row {
  flex-direction: column;
  gap: var(--space-md);
}

.two-row .content-area {
  width: 100%;
  height: 50%;
  min-height: 100px;
}

/* Side-specific styles */
.front {
  background: var(--color-surface);
}

.back {
    background: var(--color-primary);
    color: var(--color-white);
}

/* Mobile styles */
.mobile {
  padding: var(--space-sm);
}

.mobile .content-area {
  min-height: 80px;
}

.mobile.two-col {
  flex-direction: column;
}

.mobile.two-col .content-area {
  width: 100%;
  height: auto;
}

.mobile.two-row .content-area {
  min-height: 60px;
}
</style> 