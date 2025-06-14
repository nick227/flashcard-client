<template>
  <div class="card-editor-wrapper">
    <div class="card-editor">
      <div class="card-side front">
        <CardContent
          :card="card"
          mode="edit"
          side="front"
          :title="props.title || ''"
          :description="props.description || ''"
          :category="props.category || ''"
          @update="onFrontUpdate"
        />
      </div>
      <div class="card-side back">
        <CardContent
          :card="card"
          mode="edit"
          side="back"
          :title="props.title || ''"
          :description="props.description || ''"
          :category="props.category || ''"
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
import type { FlashCard } from '@/types/card'
import CardContent from '@/components/common/CardContent.vue'
import type { CardViewMode } from '@/composables/useCardMediaStyles'

const props = defineProps<{ 
  card: FlashCard,
  viewMode?: CardViewMode,
  autoFocus?: boolean,
  title?: string,
  description?: string,
  category?: string
}>()

const emit = defineEmits(['update'])

const localHint = ref(props.card.hint || '')

watch(() => props.card.hint, (val) => {
  localHint.value = val || ''
})

const onFrontUpdate = (updatedCard: FlashCard) => {
  console.log('CardEditor onFrontUpdate', updatedCard);
  emit('update', {
    ...props.card,
    front: updatedCard.front,
    hint: localHint.value
  })
}

const onBackUpdate = (updatedCard: FlashCard) => {
  console.log('CardEditor onBackUpdate', updatedCard);
  emit('update', {
    ...props.card,
    back: updatedCard.back,
    hint: localHint.value
  })
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
  border-radius: 8px;
  padding: 1rem;
  background: var(--color-white);
  display: flex;
  flex-direction: column;
}

.hint-section {
  display: block;
  width: 100%;
  padding: 0.5rem 0;
  margin-top: 0.5rem;
  background: var(--color-white);
  border-radius: 8px;
}
</style> 