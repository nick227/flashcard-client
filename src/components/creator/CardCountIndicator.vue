<template>
  <span class="inline-block bg-blue-100 text-blue-700 font-semibold px-3 py-1 rounded-full">{{ count }} cards</span>
</template>
<script setup lang="ts">
defineProps<{ count: number }>()
</script> 