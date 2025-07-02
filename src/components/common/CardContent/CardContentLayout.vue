<template>
  <div class="card-content-layout" :class="[layout, side, { 'mobile': isMobile }]">
    <CardContentCell
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
import { withDefaults } from 'vue'

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
</script>

<style scoped>
.card-content-layout {
  display: flex;
  width: 100%;
  height: 100%;
  max-height: 380px;
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
@media (max-width: 768px) {
  .card-content-layout {
    padding: var(--space-sm);
  }
}
</style> 