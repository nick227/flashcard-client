<template>
  <div class="card-content-layout" :class="[layout, side, { 'mobile': isMobile }]">
    <CardContentCell
      ref="cellRef"
      :content="content"
      :mediaUrl="mediaUrl"
      :isEditing="isEditing"
      :side="side"
      :showMediaControls="isEditing"
      :isFlipped="isFlipped"
      :cardId="cardId"
      @update="updates => $emit('update', updates)"
    />
  </div>
</template>

<script setup lang="ts">
import CardContentCell from './CardContentCell.vue'
import { withDefaults, ref, defineExpose } from 'vue'

withDefaults(defineProps<{
  layout: string
  side: 'front' | 'back'
  content: string
  mediaUrl: string | null
  isMobile?: boolean
  isEditing?: boolean
  isFlipped?: boolean
  cardId: number | string
}>(), {
  isEditing: false,
  isFlipped: false
})

defineEmits(['update'])

const cellRef = ref()
defineExpose({ cellRef })
</script>

<style scoped>
.card-content-layout {
  display: flex;
  width: 100%;
  height: 100%;
  aspect-ratio: 1/16;
  padding: var(--space-md);
  box-sizing: border-box;
  border-radius: var(--radius-lg);
  position: relative;
}

.card-content-layout.back {
  background-color: var(--color-back);
  color: var(--color-white);
}

@media (max-width: 768px) {
  .card-content-layout {
    height: var(--card-mobile-max-height) !important;
    max-height: var(--card-mobile-max-height) !important;
    aspect-ratio: 1/1;
  }
}

.content-area {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  width: 100%;
  height: 100%;
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
@media (max-width: 768px) {
  .card-content-layout {
    padding: var(--space-sm);
  }
}
</style> 