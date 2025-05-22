<template>
  <Draggable
    :list="cards"
    item-key="id"
    handle=".card-drag-handle"
    @end="onDragEnd"
    :class="layoutClass"
    :ghost-class="'dragging'"
  >
    <template #item="{ element: card, index }">
      <div :class="itemWrapperClass">
        <span class="card-drag-handle cursor-move text-gray-400 text-lg pr-1">☰</span>
        <component
          :is="cardComponent"
          :card="card"
          v-bind="cardProps"
          @update-card="$emit('edit-card', $event)"
          @delete-card="$emit('delete-card', card.id)"
          @request-delete="$emit('request-delete', card.id)"
        />
      </div>
    </template>
  </Draggable>
</template>

<script setup lang="ts">
import Draggable from 'vuedraggable'
import type { PropType } from 'vue'
const props = defineProps({
  cards: { type: Array as PropType<any[]>, required: true },
  cardComponent: { type: [Object, Function], required: true },
  layout: { type: String as PropType<'grid' | 'list'>, default: 'list' },
  cardProps: { type: Object as PropType<Record<string, any>>, default: () => ({}) }
})
const emit = defineEmits(['update-order', 'delete-card', 'edit-card', 'request-delete'])

const layoutClass = props.layout === 'grid'
  ? 'grid grid-cols-4 gap-6'
  : 'flex flex-col gap-4'
const itemWrapperClass = props.layout === 'grid'
  ? 'flex items-start gap-2'
  : 'flex items-center gap-2'

function onDragEnd() {
  emit('update-order', [...props.cards])
}
</script>

<style scoped>
.dragging {
  opacity: 0.7;
  box-shadow: 0 4px 24px 0 rgba(30,41,59,0.18);
}
</style> 