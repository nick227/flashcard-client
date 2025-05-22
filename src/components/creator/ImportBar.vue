<template>
  <div class="flex items-center gap-4">
    <input
      ref="fileInput"
      type="file"
      accept=".csv,text/csv"
      class="hidden"
      @change="onFileChange"
    />
    <a class="link" @click="openFilePicker">Import CSV</a>
    <span v-if="importFileName" class="text-gray-600">{{ importFileName }}</span>
    <button v-if="importFileName" class="button button-danger" @click="onReset">Reset</button>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{ importFileName: string|null }>()
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
function onReset() {
  if (fileInput.value) fileInput.value.value = ''
  emit('reset-clicked')
}
</script> 