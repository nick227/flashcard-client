<template>
  <button class="button button-accent" :disabled="disabled" @click="$emit('add-card')">+ Add Card</button>
</template>
<script setup lang="ts">
defineProps<{ disabled: boolean }>()
defineEmits(['add-card'])
</script> 