<template>
  <a class="link like-button" @click="handleLike">
    <i :class="['fa-solid', 'fa-heart', userLiked ? 'text-red-500' : 'text-gray-400', 'text-2xl']"></i>
    <span class="likes-count">{{ likes }}</span>
  </a>
</template>

<script setup lang="ts">
import { useCardLikes } from '@/composables/useCardLikes'
import { onMounted, watch } from 'vue'

const props = defineProps<{
  setId: number
}>()

const {
  likes,
  userLiked,
  toggleLike,
  fetchUserLikeForSet,
  fetchSetLikes
} = useCardLikes(props.setId)

const handleLike = async () => {
  try {
    const result = await toggleLike()
        // Force refresh the user like state
    await fetchUserLikeForSet()
    // Then update the total likes
    await fetchSetLikes()
  } catch (err) {
    console.error('Error toggling like:', err)
  }
}

// Initialize likes state on mount
onMounted(async () => {
  try {
        const [userLikeResult, likesResult] = await Promise.all([
      fetchUserLikeForSet(),
      fetchSetLikes()
    ])
          } catch (err) {
    console.error('Error initializing likes:', err)
  }
})
</script>

<style scoped>
.like-button {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 3rem;
  justify-content: center;
}

.likes-count {
  min-width: 1.5rem;
  text-align: center;
  display: inline-block;
}

.like-button i {
  transition: color 0.2s ease;
}

.like-button:hover i {
  transform: scale(1.1);
}
</style> 