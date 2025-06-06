<template>
  <div class="price-selector">
    <label class="block mb-1 font-medium text-gray-700">Access & Pricing</label>
    <select class="input w-full mb-2" :value="actualType" @change="onTypeChange(($event.target as HTMLSelectElement).value)">
      <option value="free">Free</option>
      <option value="subscribers">Subscribers Only</option>
      <option value="premium">Premium (One-time purchase)</option>
    </select>
    <div v-if="actualType === 'premium'" class="flex items-center gap-2 mt-1">
      <span class="text-gray-500">$</span>
      <input
        :class="['input', 'price-input', { 'input-error': showError }]"
        type="text"
        inputmode="decimal"
        :value="formattedAmount"
        @input="onAmountInput(($event.target as HTMLInputElement).value)"
        placeholder="0.00"
        style="width: 100px;"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ modelValue: { type: string, amount?: number } }>()
const emit = defineEmits(['update:modelValue'])

// Determine the actual type based on price
const actualType = computed(() => {
  if (props.modelValue.amount === 0 || props.modelValue.amount === null || props.modelValue.amount === undefined) {
    return 'free'
  }
  return props.modelValue.type
})

const formattedAmount = computed(() => {
  if (props.modelValue.amount === undefined || props.modelValue.amount === null) return '0.00'
  const amount = typeof props.modelValue.amount === 'string' ? parseFloat(props.modelValue.amount) : props.modelValue.amount
  return isNaN(amount) ? '0.00' : amount.toFixed(2)
})

function onTypeChange(type: string) {
  if (type === 'premium') {
    // Preserve existing amount if it exists and is valid, otherwise use 0
    const currentAmount = props.modelValue.amount && props.modelValue.amount > 0 
      ? props.modelValue.amount 
      : 0
    emit('update:modelValue', { type: 'premium', amount: currentAmount })
  } else {
    emit('update:modelValue', { type, amount: 0 })
  }
}

function onAmountInput(val: string) {
  // Remove any non-numeric characters except decimal point
  const cleanVal = val.replace(/[^\d.]/g, '')
  
  // Ensure only one decimal point
  const parts = cleanVal.split('.')
  const formatted = parts.length > 1 
    ? `${parts[0]}.${parts[1].slice(0, 2)}`
    : cleanVal

  const amount = parseFloat(formatted)
  emit('update:modelValue', { 
    type: 'premium', 
    amount: isNaN(amount) ? 0 : amount 
  })
}

const showError = computed(() => {
  return actualType.value === 'premium' && (!props.modelValue.amount || props.modelValue.amount <= 0)
})
</script>

<style scoped>
.price-selector {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.5rem;
}
.price-input {
  width: 90px;
  font-size: 1em;
  padding: 0.4rem 0.7rem;
  text-align: right;
}
.input-error {
  border-color: var(--color-danger);
}
</style> 