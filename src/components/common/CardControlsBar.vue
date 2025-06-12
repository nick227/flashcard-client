<template>
  <div class="card-controls-bar">
    <button
      class="control-btn"
      @click="$emit('toggle-layout')"
      :title="'Toggle Layout'"
    >
      <i class="fa fa-columns"></i>
    </button>
    <button
      class="control-btn"
      @click="$emit('add-media')"
      :title="'Add Media'"
    >
      <i class="fa fa-image"></i>
    </button>
    <button
      class="control-btn"
      @click="$emit('ai-generate')"
      :title="'AI Generate Card'"
      :disabled="aiLoading"
    >
      <i :class="aiLoading ? 'fa fa-spinner fa-spin' : 'fa fa-magic'"></i>
    </button>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
defineProps<{ aiLoading: boolean }>()
defineEmits(['toggle-layout', 'add-media', 'ai-generate'])
</script>

<style scoped>
.card-controls-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  align-items: center;
  justify-content: center;
}
.control-btn {
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  padding: 0.5em 0.7em;
  cursor: pointer;
  font-size: 1.1em;
  transition: background 0.2s;
}
.control-btn:hover {
  background: #e0e7ef;
}
</style> 