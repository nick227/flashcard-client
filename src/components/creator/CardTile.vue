<template>
  <div class="card-tile bg-white rounded-xl shadow p-4 flex flex-col items-stretch h-full">
    <div class="flex justify-between items-center mb-2">
      <button class="button button-danger text-xs px-2 py-1" @click="onRequestDelete">Delete</button>
    </div>
    <label class="block text-gray-500 text-xs mb-1">Front</label>
    <textarea class="input mb-2" v-model="localCard.front" @input="emitUpdate" maxlength="2000" placeholder="Front text..."></textarea>
    <label class="block text-gray-500 text-xs mb-1">Back</label>
    <textarea class="input" v-model="localCard.back" @input="emitUpdate" maxlength="2000" placeholder="Back text..."></textarea>
    <label class="block text-gray-500 text-xs mb-1">Hint</label>
    <textarea class="input" v-model="localCard.hint" @input="emitUpdate" placeholder="Hint..."></textarea>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{ card: any }>()
const emit = defineEmits(['update-card', 'delete-card', 'request-delete'])
const localCard = ref({ ...props.card })

// Update watch to handle deep changes
watch(() => props.card, (val) => { 
  localCard.value = { ...val }
}, { deep: true })

function emitUpdate() {
  emit('update-card', { ...localCard.value })
}

// Add immediate update on mount
onMounted(() => {
  emitUpdate()
})

function onRequestDelete() {
  emit('request-delete', localCard.value.id)
}
</script>

<style scoped>
.card-tile {
  background: #fff;
  border: 1.5px solid #e5e7eb;
  border-radius: 1.25rem;
  box-shadow: 0 4px 24px 0 rgba(30,41,59,0.08);
  min-height: 220px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  width: 100%;
}
.button.button-danger {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
  font-size: 0.95em;
  padding: 0.2em 0.8em;
  border-radius: 0.5em;
}
.button.button-danger:hover {
  background: #dc2626;
  border-color: #dc2626;
}
</style> 