<template>
  <div class="card-editor-wrapper">
    <div class="card-editor">
      <div class="card-side front">
        <CardContent
          :card="card"
          side="front"
          :is-editing="true"
          :title="props.title || ''"
          :description="props.description || ''"
          :category="props.category || ''"
          :onImageFile="props.onImageFile"
          @update="onFrontUpdate"
        />
      </div>
      <div class="card-side back">
        <CardContent
          :card="card"
          side="back"
          :is-editing="true"
          :title="props.title || ''"
          :description="props.description || ''"
          :category="props.category || ''"
          :onImageFile="props.onImageFile"
          @update="onBackUpdate"
        />
      </div>
    </div>
    <div class="hint-section">
      <input 
        type="text" 
        class="input w-full" 
        v-model="localHint" 
        @input="onHintUpdate" 
        placeholder="Hint..." 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Card } from '@/types/card'
import CardContent from '@/components/common/CardContent.vue'

const props = defineProps<{
  card: Card
  title?: string
  description?: string
  category?: string
  onImageFile?: (data: { file: File, side: 'front' | 'back', cellIndex: number }) => void
}>()

const emit = defineEmits<{
  (e: 'update', card: Card): void
}>()

const localHint = ref(props.card.hint || '')

watch(() => props.card.hint, (val) => {
  localHint.value = val || ''
})

function onFrontUpdate(updatedCard: Card) {
  emit('update', updatedCard)
}

function onBackUpdate(updatedCard: Card) {
  emit('update', updatedCard)
}

const onHintUpdate = () => {
  emit('update', {
    ...props.card,
    hint: localHint.value
  })
}
</script>

<style scoped>
.card-editor-wrapper {
  display: block;
  width: 100%;
}

.card-editor {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-side {
  flex: 1;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
}

.hint-section {
  display: block;
  width: 100%;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
}
</style> 