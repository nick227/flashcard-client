<template>
  <div class="flex">
    <a title="Show Hint" @click="$emit('show-hint')" class="button-round" href="javascript:void(0)"><i class="fa-solid fa-question-circle"></i> Hint</a>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  hint: string
}>()

defineEmits<{
  (e: 'show-hint'): void
}>()
</script> 