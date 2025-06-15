<template>
  <div>
    <span v-if="error" class="text-red-500 text-xs">{{ error }}</span>
    <component
      :is="inputType"
      :value="modelValue"
      @input="handleInput"
      :class="[
        'input w-full',
        { 'input-error': error }
      ]"
      :placeholder="placeholder"
      :required="required"
      :disabled="disabled"
      :type="type === 'text' ? inputType : undefined"
      :min="min"
      :max="max"
      :aria-label="ariaLabel"
      :aria-invalid="!!error"
      :aria-describedby="error ? `${id}-error` : undefined"
    >
      <template v-if="type === 'select' && !modelValue">
        <slot></slot>
      </template>
      <template v-else>
        <slot></slot>
      </template>
    </component>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  modelValue: string | number | null
  type?: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'password'
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  min?: number
  max?: number
  ariaLabel?: string
  id?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
}>()

const inputType = computed(() => {
  switch (props.type) {
    case 'textarea':
      return 'textarea'
    case 'select':
      return 'select'
    default:
      return 'input'
  }
})

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
  const value = target.type === 'number' ? Number(target.value) : target.value
  emit('update:modelValue', value)
}
</script> 