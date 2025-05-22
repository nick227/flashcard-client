<template>
  <div v-if="modelValue" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
      <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
      <p class="text-gray-600 mb-6">{{ text }}</p>
      <div class="flex justify-end gap-4">
        <button class="px-4 py-2 text-gray-600 hover:text-gray-800" @click="$emit('update:modelValue', false)">No</button>
        <button class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" @click="confirm">Yes</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: boolean
  title: string
  text: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm'): void
}>()

const confirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}
</script> 