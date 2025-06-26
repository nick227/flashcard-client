<template>
  <div class="media-container">
    <img v-if="type === 'image'" :src="url" alt="Card image" style="width: 100%; height: 100%; object-fit: contain;" />
    <iframe
      v-else-if="type === 'youtube'"
      :src="url"
      width="100%"
      height="100%"
      frameborder="0"
      allowfullscreen
      loading="lazy"
      referrerpolicy="no-referrer"
      title="YouTube video player"
      importance="high"
      style="width: 100%; height: 100%; border: none;"
    ></iframe>
    <button class="media-close" @click="$emit('remove', url)" aria-label="Remove media">
      <i class="fas fa-times"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{ url: string; type: 'image' | 'youtube' }>()
</script>

<style scoped>
.media-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  overflow: hidden;
  position: relative;
}
.media-close {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  transition: background-color 0.2s ease;
  z-index: 1;
}
.media-close:hover {
  background: rgba(0, 0, 0, 0.7);
}
.media-close i {
  font-size: 0.75rem;
}
</style> 