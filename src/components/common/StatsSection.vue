<template>
  <div class="stats-section">
    <div v-if="loading" class="stats-loading">Loading stats...</div>
    <div v-else class="stats-grid">
      <div class="stat-item">
        <span class="stat-number">{{ totalSetsDisplay }}</span>
        <span class="stat-label">Active Sets</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ totalUsersDisplay }}</span>
        <span class="stat-label">Learners</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ totalCategoriesDisplay }}</span>
        <span class="stat-label">Categories</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { api } from '@/api'

const props = defineProps({
  totalSets: { type: Number, default: null },
  totalUsers: { type: Number, default: null },
  totalCategories: { type: Number, default: null }
})

const loading = ref(false)
const setsCount = ref<number|null>(null)
const usersCount = ref<number|null>(null)
const categoriesCount = ref<number|null>(null)

const totalSetsDisplay = computed(() => props.totalSets ?? setsCount.value ?? '–')
const totalUsersDisplay = computed(() => props.totalUsers ?? usersCount.value ?? '–')
const totalCategoriesDisplay = computed(() => props.totalCategories ?? categoriesCount.value ?? '–')

onMounted(async () => {
  if (props.totalSets !== null && props.totalUsers !== null && props.totalCategories !== null) return
  loading.value = true
  try {
    // Sets count
    const setsCountRes = await api.get('/sets/count')
    setsCount.value = setsCountRes.data.count
    // Users count
    const usersCountRes = await api.get('/users/count')
    usersCount.value = usersCountRes.data.count
    // Categories count
    const categoriesCountRes = await api.get('/categories/count')
    categoriesCount.value = categoriesCountRes.data.count
  } catch (e) {
    // fallback: show dashes
    setsCount.value = usersCount.value = categoriesCount.value = null
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.stats-section {
  width: 100%;
}
.stats-loading {
  @apply text-gray-400 text-center py-6;
}
.stats-grid {
  display: flex;
  flex-direction: row;
  gap: 1rem;
  justify-content: center;
  align-items: center;
}
.stat-item {
  @apply text-center p-4 bg-white/50 rounded-lg;
}
.stat-number {
  @apply block text-xl font-bold text-blue-600;
}
.stat-label {
  @apply text-xs text-gray-500;
}
</style> 