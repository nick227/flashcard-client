<template>
  <div class="auth-toggle flex gap-2 mb-6">
    <button
      class="toggle-btn"
      :class="{ active: mode === 'login' }"
      @click="$emit('update:mode', 'login')"
      type="button"
    >Existing Users</button>
    <button
      class="toggle-btn"
      :class="{ active: mode === 'register' }"
      @click="$emit('update:mode', 'register')"
      type="button"
    >New Members</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ mode: 'login' | 'register' }>()
</script>

<style scoped>
.toggle-btn {
  padding: 0.6em 1em;
  border-radius: 0.7em;
  border: none;
  background: var(--color-subtle);
  color: var(--color-text);
  font-weight: 600;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
  font-size: 1em;
}
.toggle-btn.active {
  background: var(--color-primary);
  color: #fff;
}
</style> 