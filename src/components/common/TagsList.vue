<template>
  <div v-if="tags.length > 0" class="tags-list">
    <span v-for="tag in tags" :key="tag" class="tag-chip">
      {{ tag }}
      <button v-if="removable" type="button" class="remove-btn" @click="$emit('remove', tag)" aria-label="Remove tag">&times;</button>
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  tags: string[],
  removable?: boolean
}>()

defineEmits<{
  (e: 'remove', tag: string): void
}>()
</script>

<style scoped>
.tags-list {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.4rem;
  margin-top: 0.2rem;
  min-height: 1.5rem;
}
.tag-chip {
  display: flex;
  align-items: center;
  background: #e0e7ef;
  color: #2563eb;
  font-weight: 500;
  border-radius: 999px;
  padding: 0.18rem 0.7rem;
  font-size: 0.95em;
  margin-right: 0.1rem;
  margin-bottom: 0.1rem;
  box-shadow: 0 1px 2px 0 rgba(30,41,59,0.04);
}
.remove-btn {
  background: none;
  border: none;
  color: #64748b;
  font-size: 1.1em;
  margin-left: 0.3em;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}
</style> 