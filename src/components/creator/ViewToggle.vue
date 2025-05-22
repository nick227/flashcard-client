<template>
  <div class="inline-flex rounded-full bg-gray-100 p-1 shadow-sm border border-gray-200">
    <button
      class="px-5 py-2 rounded-full font-semibold focus:outline-none transition-colors duration-150"
      :class="modelValue === 'grid' ? 'bg-blue-600 text-white shadow' : 'bg-transparent text-gray-600 hover:bg-gray-200'"
      @click="$emit('update:modelValue', 'grid')"
      type="button"
    >
      Grid View
    </button>
    <button
      class="px-5 py-2 rounded-full font-semibold focus:outline-none transition-colors duration-150"
      :class="modelValue === 'single' ? 'bg-blue-600 text-white shadow' : 'bg-transparent text-gray-600 hover:bg-gray-200'"
      @click="$emit('update:modelValue', 'single')"
      type="button"
    >
      Single-Column
    </button>
  </div>
</template>
<script setup lang="ts">
defineProps<{ modelValue: 'grid'|'single' }>()
defineEmits(['update:modelValue'])
</script> 