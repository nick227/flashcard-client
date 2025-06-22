<template>
  <div class="visibility-toggle">
    <label class="switch" :title="isHidden ? 'Hidden (click to show)' : 'Visible (click to hide)'"
      :aria-label="isHidden ? 'Show set' : 'Hide set'" :class="{ 'opacity-50': loading }">
      <input type="checkbox" :checked="!isHidden" @change="handleToggle" :disabled="loading" :aria-disabled="loading" />
      <div v-if="isHidden" class="visibility-text text-red-500">
        <i class="fa-solid fa-eye-slash"></i>
      </div>
      <div v-else class="visibility-text text-green-600">
        <i class="fa-solid fa-eye"></i>
      </div>
    </label>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { api } from '@/api'

const props = defineProps<{
  setId: number
  initialHidden: boolean
}>()

const isHidden = ref(props.initialHidden)
const loading = ref(false)

// Update local state if prop changes
watch(() => props.initialHidden, (newValue) => {
  isHidden.value = newValue
})

const handleToggle = async () => {
  if (loading.value) return
  loading.value = true

  try {
    await api.post(`/sets/${props.setId}/toggle-hidden`)
    isHidden.value = !isHidden.value
  } catch (error) {
    console.error('Failed to toggle visibility:', error)
    // Revert the toggle on error
    isHidden.value = !isHidden.value
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.visibility-toggle {
  display: inline-flex;
  align-items: center;
  min-width: 80px;
  height: 24px;
}

.switch {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  transition: opacity 0.2s ease;
}

.switch input {
  display: none;
}

.visibility-text {
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s ease;
  white-space: nowrap;
}
</style>