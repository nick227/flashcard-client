<template>
  <div class="flex flex-col gap-4">
    <Draggable
      :list="cards"
      item-key="id"
      handle=".card-drag-handle"
      @end="onDragEnd"
    >
      <template #item="{ element: card }">
        <div class="flex items-center gap-2">
          <span class="card-drag-handle cursor-move text-gray-400 text-lg pr-1">☰</span>
          <FlashCardScaffold
            :card="card"
            :editable="true"
            :showControls="true"
            @update:card="$emit('edit-card', $event)"
            @delete="$emit('request-delete', card.id)"
          />
        </div>
      </template>
    </Draggable>
  </div>
</template>
<script setup lang="ts">
import FlashCardScaffold from '@/components/common/FlashCardScaffold.vue'
import Draggable from 'vuedraggable'
defineProps<{ cards: any[], autoFocusId?: string }>()
const emit = defineEmits(['update-order', 'delete-card', 'edit-card', 'request-delete'])
function onDragEnd(e: any) {
  emit('update-order', e.to)
}
</script> 