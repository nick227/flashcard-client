<template>
  <div class="card-tile" :class="{ 'is-editing': isEditing }">
    <div class="card-content">
      <div class="card-face front">
        <CardContent
          :text="card.front.text"
          :imageUrl="card.front.imageUrl || undefined"
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
          :text="card.back.text"
          :imageUrl="card.back.imageUrl || undefined"
          :mode="isEditing ? 'edit' : 'view'"
          side="back"
          :title="props.title || ''"
          :description="props.description || ''"
          :category="props.category || ''"
          @update="updateBack"
        />
      </div>
    </div>
    <div class="card-actions">
      <button class="button button-danger button-icon" @click="onRequestDelete">
        <i class="fa-solid fa-trash"></i>
      </button>
      <button class="button button-accent" @click="toggleEdit">
        {{ isEditing ? 'Preview' : 'Edit' }}
      </button>
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

const updateFront = (text: string) => {
  console.log('CardTile - Updating front:', { 
    oldText: props.card.front.text, 
    newText: text,
    imageUrl: props.card.front.imageUrl 
  })
  emit('update', {
    ...props.card,
    front: { ...props.card.front, text }
  })
}

const updateBack = (text: string) => {
  console.log('CardTile - Updating back:', { 
    oldText: props.card.back.text, 
    newText: text,
    imageUrl: props.card.back.imageUrl 
  })
  emit('update', {
    ...props.card,
    back: { ...props.card.back, text }
  })
}

const toggleEdit = () => {
  isEditing.value = !isEditing.value
  console.log('CardTile - Toggled edit mode:', isEditing.value)
}

const onRequestDelete = () => {
  console.log('CardTile - Delete requested for card:', props.card.id)
  emit('request-delete', props.card.id)
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
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem;
}

.card-content {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.back {
  transform: rotateY(180deg);
}

.is-editing .card-content {
  transform: rotateY(180deg);
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