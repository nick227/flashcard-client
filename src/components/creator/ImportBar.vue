<template>
  <div class="flex items-center gap-4">
    <input
      ref="fileInput"
      type="file"
      accept=".csv,text/csv"
      class="hidden"
      @change="onFileChange"
    />
    <a class="button px-3 py-1 text-sm rounded-md bg-gray-100 text-gray-600" @click="openFilePicker">{{ importFileName ? importFileName : 'Import CSV' }}</a>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
defineProps<{ importFileName: string|null }>()
const emit = defineEmits(['import-csv', 'reset-clicked'])
const fileInput = ref<HTMLInputElement|null>(null)

function openFilePicker() {
  fileInput.value?.click()
}
function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files && files[0]) {
    emit('import-csv', files[0])
  }
}
</script> 

<style scoped>
.button:hover {
  background-color: var(--color-primary);
  color: var(--color-white);
}
</style>