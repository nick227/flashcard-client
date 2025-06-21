<template>
  <button class="button button-accent" @click="$emit('add-card')">Add Card</button>
</template>
<script setup lang="ts">
defineEmits(['add-card'])
</script> 