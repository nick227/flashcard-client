<template>
  <div class="card-tile" :class="{ 'is-flipped': isFlipped }">
    <div class="drag-handle">
      <i class="fa-solid fa-grip-vertical"></i>
    </div>
    <div class="card-content" :class="{ 'is-flipped': isFlipped }" @click="toggleFlip">
      <div class="card-face front">
        <CardContent
          :card="card"
          :mode="isEditing ? 'edit' : 'view'"
          side="front"
          :title="props.title || ''"
          :description="props.description || ''"
          :category="props.category || ''"
          @update="updateFront"
        />
      </div>
      <div class="card-face back">
        <CardContent
          :card="card"
          :mode="isEditing ? 'edit' : 'view'"
          side="back"
          :title="props.title || ''"
          :description="props.description || ''"
          :category="props.category || ''"
          @update="updateBack"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { FlashCard } from '@/types/card'
import CardContent from '@/components/common/CardContent.vue'
import type { CardViewMode } from '@/composables/useCardMediaStyles'

const props = defineProps<{
  card: FlashCard
  viewMode?: CardViewMode
  title?: string
  description?: string
  category?: string
}>()

const emit = defineEmits(['update', 'delete', 'request-delete'])

const isEditing = ref(false)
const isFlipped = ref(false)

// Log initial props
console.log('CardTile - Component created with props:', {
  card: props.card,
  viewMode: props.viewMode,
  front: {
    text: props.card.front.text,
    imageUrl: props.card.front.imageUrl
  },
  back: {
    text: props.card.back.text,
    imageUrl: props.card.back.imageUrl
  }
})

// Watch for card changes
watch(() => props.card, (newCard) => {
  console.log('CardTile - Card updated:', {
    front: {
      text: newCard.front.text,
      imageUrl: newCard.front.imageUrl
    },
    back: {
      text: newCard.back.text,
      imageUrl: newCard.back.imageUrl
    }
  })
}, { deep: true })

onMounted(() => {
  console.log('CardTile - Component mounted:', {
    card: props.card,
    viewMode: props.viewMode,
    isEditing: isEditing.value,
    isFlipped: isFlipped.value,
    front: {
      text: props.card.front.text,
      imageUrl: props.card.front.imageUrl
    },
    back: {
      text: props.card.back.text,
      imageUrl: props.card.back.imageUrl
    }
  })
})

function updateFront(updatedCard: FlashCard) {
  console.log('CardTile - Updating front:', { 
    oldText: props.card.front.text, 
    newText: updatedCard.front.text,
    imageUrl: updatedCard.front.imageUrl 
  })
  emit('update', {
    ...props.card,
    front: updatedCard.front
  })
}

function updateBack(updatedCard: FlashCard) {
  console.log('CardTile - Updating back:', { 
    oldText: props.card.back.text, 
    newText: updatedCard.back.text,
    imageUrl: updatedCard.back.imageUrl 
  })
  emit('update', {
    ...props.card,
    back: updatedCard.back
  })
}

const toggleFlip = () => {
  isFlipped.value = !isFlipped.value
  console.log('CardTile - Toggled flip:', isFlipped.value)
}
</script>

<style scoped>
.card-tile {
  position: relative;
  width: 100%;
  height: 100%;
  perspective: 1000px;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.card-tile :deep(.media-text) {
  font-size: 1.2rem !important;
}

.drag-handle {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
  opacity: 0.5;
  transition: opacity 0.2s;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.5rem;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: move;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.drag-handle:hover {
  opacity: 1;
}

.card-content {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.3s ease;
  will-change: transform;
}

.card-content.is-flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 0;
  overflow: hidden;
}

.card-face.front {
  background: white;
  transform: rotateY(0deg);
}

.card-face.back {
  background: var(--color-primary);
  transform: rotateY(180deg);
  color: white;
}

.card-actions {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  display: flex;
  gap: 0.5rem;
  z-index: 10;
}

.button {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.button-icon {
  padding: 0.25rem;
  width: 1.5rem;
  height: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.button-danger {
  background: #ef4444;
  color: white;
}

.button-accent {
  background: #3b82f6;
  color: white;
}

.button:hover {
  opacity: 0.9;
}
</style> 