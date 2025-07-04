<template>
  <div class="toaster-container">
    <transition-group name="fade" tag="div">
      <div v-for="t in toasts" :key="t.id" 
        :class="['toaster', typeClass(t.type)]" 
        @click="remove(t.id)">
        {{ t.message }}
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

defineProps<{
  toasts: Toast[]
}>()

const emit = defineEmits<{
  (e: 'remove', id: number): void
}>()

function typeClass(type: string) {
  if (type === 'success') return 'toaster-success'
  if (type === 'error') return 'toaster-error'
  return 'toaster-info'
}

function remove(id: number) {
  emit('remove', id)
}
</script>

<style scoped>
.toaster-container {
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  min-width: 240px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  pointer-events: none;
  gap: 0.5rem;
  /* Ensure container doesn't affect document flow */
  position: fixed;
  pointer-events: none;
  width: 100%;
  height: 0;
  overflow: visible;
}

.toaster {
  pointer-events: auto;
  padding: 1rem 2.5rem;
  border-radius: 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  box-shadow: 0 4px 24px 0 rgba(30,41,59,0.12);
  text-align: center;
  opacity: 0.97;
  cursor: pointer;
  transition: all 0.3s ease;
  width: fit-content;
  max-width: 100%;
  /* Ensure toasts don't affect document flow */
  position: relative;
  margin: 0;
}

.toaster:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px 0 rgba(30,41,59,0.15);
}

.toaster-success {
  background: #22c55e;
  color: #fff;
}

.toaster-error {
  background: #ef4444;
  color: #fff;
}

.toaster-info {
  background: var(--color-primary);
  color: #fff;
}

/* Animation */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.4s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style> 