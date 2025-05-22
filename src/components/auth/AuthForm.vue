<template>
  <form class="auth-form w-full flex flex-col gap-4 w-full" @submit.prevent="onSubmit">
    <slot name="description"></slot>
    <slot name="error"></slot>
    <input
      v-model="email"
      class="input"
      type="email"
      placeholder="Email"
      autocomplete="email"
      required
    />
    <div class="relative">
      <input
        v-model="password"
        class="input pr-12"
        :type="showPassword ? 'text' : 'password'"
        placeholder="Password"
        autocomplete="current-password"
        required
      />
      <button type="button" class="show-btn" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Hide password' : 'Show password'">
        <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
      </button>
    </div>
    <button :class="['button', mode === 'login' ? 'button-accent' : 'button-success', 'w-full', 'mt-2']" type="submit">
      {{ mode === 'login' ? 'Sign In' : 'Create Account' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const props = defineProps<{ mode: 'login' | 'register' }>()
const emit = defineEmits(['submit'])
const email = ref('')
const password = ref('')
const showPassword = ref(false)
function onSubmit() {
  emit('submit', { email: email.value, password: password.value })
}
</script>

<style scoped>
.input {
  width: 100%;
  padding: 0.9em 1.2em;
  border-radius: 0.7em;
  border: 1.5px solid var(--color-border);
  font-size: 1.1em;
  background: var(--color-surface);
  color: var(--color-text);
  margin-bottom: 0.1em;
  transition: border 0.2s;
}
.input:focus {
  border-color: var(--color-primary);
}
.show-btn {
  position: absolute;
  right: 0.7em;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-muted);
  font-size: 1.2em;
  cursor: pointer;
  padding: 0;
}
</style> 