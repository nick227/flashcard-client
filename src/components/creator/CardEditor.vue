<template>
  <div class="card-editor">
    <div class="card-side front">
      <CardContentEditor
        :text="card.front.text"
        @update="onFrontUpdate"
        @tab="onTab"
      />
    </div>
    <div class="card-side back">
      <CardContentEditor
        :text="card.back.text"
        @update="onBackUpdate"
        @tab="onTab"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { Card } from '@/types/card'
import CardContentEditor from './CardContentEditor.vue'

const props = defineProps<{ 
  card: Card,
  autoFocus?: boolean 
}>()

const emit = defineEmits(['update'])

const frontRef = ref<HTMLElement | null>(null)

const onFrontUpdate = (text: string) => {
  const updatedCard = {
    ...props.card,
    front: {
      ...props.card.front,
      text
    }
  }
  emit('update', updatedCard)
}

const onBackUpdate = (text: string) => {
  const updatedCard = {
    ...props.card,
    back: {
      ...props.card.back,
      text
    }
  }
  emit('update', updatedCard)
}

const onTab = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement
  const isFront = target.closest('.front')
  const nextElement = isFront ? 
    target.closest('.card-editor')?.querySelector('.back .media-text') :
    target.closest('.card-editor')?.querySelector('.front .media-text')
  if (nextElement instanceof HTMLElement) {
    nextElement.focus()
  }
}

// Auto focus handling
watch(() => props.autoFocus, (val) => {
  if (val) nextTick(() => frontRef.value?.focus())
}, { immediate: true })
</script>

<style scoped>
.card-editor {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-side {
  flex: 1;
  min-height: 200px;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  background: white;
}
</style> 