<template>
  <div class="card">
    <div v-if="set.category" @click="router.push({ path: '/browse/' + set.category })" class="category-badge link">{{ set.category }}</div>
    <img v-if="set.thumbnail" :src="set.thumbnail" :alt="set.title + ' thumbnail'" class="card-image" />
    <img v-else class="card-image-placeholder" :src="'http://placehold.co/300x200/white/black?text=' + set.title" />
    <div class="card-content">
      <div class="card-title mb-2">{{ set.title }}</div>
      <div class="card-description">{{ set.description }}</div>
      <div class="card-meta w-full flex justify-between">
        <span v-if="set.price === 0 && !set.isSubscriberOnly" class="text-green-600 font-bold">Free</span>
        <span v-else-if="set.isSubscriberOnly" class="text-purple-600 font-bold">Subscriber Only</span>
        <span v-else class="text-blue-600 font-bold">${{ set.price }}</span>
        <TagsList :tags="tags" :removable="false" />
      </div>
    </div>
    <div class="card-actions">
      <button class="button w-full" @click="goToSet">View Set</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import TagsList from '@/components/common/TagsList.vue'

const props = defineProps({
  set: {
    type: Object,
    required: true
  }
})

defineEmits(['view'])

const router = useRouter()
const goToSet = () => {
  router.push({ path: '/study/' + props.set.id })
}
const tags = computed(() => props.set.tags || [])

console.log('SetPreviewCard');
console.log(props.set);
</script>

<style scoped>
</style>