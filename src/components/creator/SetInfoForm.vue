<template>
  <form class="grid gap-4 mb-8">
    <!-- Thumbnail upload section -->
    <ThumbnailUploader
      :title="props.title"
      :description="props.description"
      :thumbnail="props.thumbnail"
      :disabled="props.isSubmitting"
      @update:thumbnail="$emit('update:thumbnail', $event)"
    />

    <!-- Set title input -->
    <FormInput
      type="text"
      :modelValue="props.title"
      @update:modelValue="$emit('update:title', $event)"
      placeholder="Set Title"
      :error="props.formSubmitted && !props.title ? 'Title is required.' : undefined"
      :required="true"
      :disabled="props.isSubmitting"
      ariaLabel="Set title"
      id="set-title"
    />

    <!-- Set description input -->
    <FormInput
      type="textarea"
      :modelValue="props.description"
      @update:modelValue="$emit('update:description', $event)"
      placeholder="Description"
      :error="props.formSubmitted && !props.description ? 'Description is required.' : undefined"
      :required="true"
      :disabled="props.isSubmitting"
      ariaLabel="Set description"
      id="set-description"
    />

    <!-- Category selection -->
    <FormInput
      type="select"
      :modelValue="props.category"
      @update:modelValue="$emit('update:category', Number($event))"
      :error="props.formSubmitted && !props.category ? 'Category is required.' : undefined"
      :required="true"
      :disabled="props.isSubmitting"
      ariaLabel="Set category"
      id="set-category"
    >
      <option value="" disabled>Select Category</option>
      <option v-for="cat in props.categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
    </FormInput>

    <!-- Tags and price components -->
    <TagsInput 
      :availableTags="props.availableTags" 
      :modelValue="props.tags" 
      :setId="props.setId"
      :disabled="props.isSubmitting"
      @update:modelValue="$emit('update:tags', $event)" 
    />
    <PriceSelector 
      :modelValue="props.price" 
      :disabled="props.isSubmitting"
      @update:modelValue="$emit('update:price', $event)" 
    />
  </form>
</template>

<script setup lang="ts">
import TagsInput from './TagsInput.vue'
import PriceSelector from './PriceSelector.vue'
import ThumbnailUploader from './ThumbnailUploader.vue'
import FormInput from '../common/FormInput.vue'

// Component props definition
const props = defineProps<{
  title: string
  description: string
  category: number | null
  tags: string[]
  price: any
  categories: { id: number, name: string }[]
  availableTags: string[]
  formSubmitted?: boolean
  thumbnail?: string | null
  setId: number
  isSubmitting: boolean
}>()

// Component events
const emit = defineEmits([
  'update:title',
  'update:description',
  'update:category',
  'update:tags',
  'update:price',
  'update:thumbnail'
])
</script>

<style scoped>
/* Loading spinner animation */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>