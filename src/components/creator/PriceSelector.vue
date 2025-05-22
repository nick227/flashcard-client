<template>
  <div class="price-selector">
    <label class="block mb-1 font-medium text-gray-700">Access & Pricing</label>
    <select class="input w-full mb-2" :value="modelValue.type" @change="onTypeChange(($event.target as HTMLSelectElement).value)">
      <option value="free">Free</option>
      <option value="subscribers">Subscribers Only</option>
      <option value="premium">Premium (One-time purchase)</option>
    </select>
    <div v-if="modelValue.type === 'premium' || modelValue.type === 'subscribers'" class="flex items-center gap-2 mt-1">
      <span class="text-gray-500">$</span>
      <input
        class="input price-input"
        type="text"
        inputmode="decimal"
        :value="formattedAmount"
        @input="onAmountInput(($event.target as HTMLInputElement).value)"
        placeholder="0.00"
        style="width: 100px;"
      />
      <span v-if="showError" class="text-red-500 text-xs ml-2">Enter a valid price</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ modelValue: { type: string, amount?: number } }>()
const emit = defineEmits(['update:modelValue'])

const formattedAmount = computed(() => {
  if (props.modelValue.amount === undefined || props.modelValue.amount === null) return '0.00'
  const amount = typeof props.modelValue.amount === 'string' ? parseFloat(props.modelValue.amount) : props.modelValue.amount
  return isNaN(amount) ? '0.00' : amount.toFixed(2)
})

function onTypeChange(type: string) {
  if (type === 'premium') {
    emit('update:modelValue', { type: 'premium', amount: props.modelValue.amount || 0 })
  } else if (type === 'subscribers') {
    emit('update:modelValue', { type: 'subscribers', amount: props.modelValue.amount || 0 })
  } else {
    emit('update:modelValue', { type })
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
  return props.modelValue.type === 'premium' && (!props.modelValue.amount || props.modelValue.amount <= 0)
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
</style> 