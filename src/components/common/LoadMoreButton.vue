<template>
  <button class="load-more-btn" @click="$emit('click')">
    <span class="icon-wrapper">
      <svg width="32" height="32" viewBox="0 0 32 32" class="load-more-icon" fill="none">
        <circle cx="16" cy="16" r="14" stroke="#6366f1" stroke-width="2.5" fill="#f5f6fa" />
        <path d="M10 16h12M16 10v12" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
    </span>
    <span class="label"><slot>Load More Sets</slot></span>
  </button>
</template>

<script setup lang="ts">
// No props needed, emits click
</script>

<style scoped>
.load-more-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.1rem;
  padding: 1.1rem 2.2rem;
  font-size: 1.25rem;
  font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
  background: var(--color-subtle);
  color: var(--color-text);
  border: none;
  border-radius: 2.5rem;
  cursor: pointer;
  margin: 0 auto;
  margin-top: 2.5rem;
  margin-bottom: 1.5rem;
  outline: none;
  position: relative;
}
.load-more-btn:hover, .load-more-btn:focus {
  background: #eef2ff;
}
.load-more-btn:active {
  background: var(--color-white);
}
.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
}
.load-more-icon {
  display: block;
}
.label {
  font-weight: 500;
  letter-spacing: 0.01em;
  color: #6366f1;
}
</style> 