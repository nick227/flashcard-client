<template>
  <form class="auth-form w-full flex flex-col gap-4 w-full" @submit.prevent="onSubmit">
    <div v-if="formError" class="text-red-600 bg-red-50 border border-red-200 rounded px-4 py-2 mb-2 text-center">
      <i class="fas fa-exclamation-circle mr-2"></i>{{ formError }}
    </div>
    <slot name="description"></slot>
    <slot name="error"></slot>
    <div v-if="mode === 'register'" class="relative">
      <div class="relative">
        <input
          v-model="name"
          class="input"
          :class="{ 'border-red-500': nameError }"
          type="text"
          placeholder="Name"
          autocomplete="name"
          required
          minlength="2"
          maxlength="50"
          @input="onNameInput"
        />
        <div v-if="nameError" class="absolute right-2 top-1/2 -translate-y-1/2 text-red-500 exclamation-circle">
          <i class="fas fa-exclamation-circle"></i>
        </div>
      </div>
      <div v-if="nameError" class="text-red-500 text-sm mt-1 flex items-center gap-1">
        <i class="fas fa-info-circle"></i>
        {{ nameError }}
      </div>
      <div v-else-if="checkingName" class="text-gray-500 text-sm mt-1 flex items-center gap-1">
        <i class="fas fa-spinner fa-spin"></i>
        Checking name availability...
      </div>
      <div v-else-if="name && !nameError" class="text-green-500 text-sm mt-1 flex items-center gap-1">
        <i class="fas fa-check-circle"></i>
        Name is valid
      </div>
    </div>
    <div v-if="mode === 'register'" class="relative">
      <textarea
        v-model="bio"
        class="input"
        placeholder="Tell us about yourself"
        minlength="0"
        rows="3"
      ></textarea>
    </div>
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
        minlength="6"
      />
      <button type="button" class="show-btn" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Hide password' : 'Show password'">
        <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
      </button>
    </div>
    <button 
      :class="['button', mode === 'login' ? 'button-accent' : 'button-success', 'w-full', 'mt-2']" 
      type="submit"
      :disabled="!isFormValid"
    >
      {{ mode === 'login' ? 'Sign In' : 'Create Account' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'
import { api } from '@/api'

const props = defineProps<{ mode: 'login' | 'register' }>()
const emit = defineEmits(['submit'])
const name = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const nameError = ref('')
const checkingName = ref(false)
const bio = ref('')
let nameCheckTimeout: number | null = null
const formError = ref('')

// Form validation state
const isFormValid = computed(() => {
  if (props.mode === 'register') {
    return name.value.trim().length >= 2 && 
           !nameError.value && 
           !checkingName.value &&
           email.value.includes('@') &&
           password.value.length >= 6
  }
  return email.value.includes('@') && password.value.length >= 6
})

// Cleanup on component unmount
onUnmounted(() => {
  if (nameCheckTimeout) {
    clearTimeout(nameCheckTimeout)
  }
})

async function checkNameExists(value: string) {
  if (!value || value.length < 2) {
    return false;
  }
  checkingName.value = true;
  try {
    // Use the standard api object and endpoint
    const res = await api.get(`users/name-exists`, { params: { name: value } });
    if (res.data.exists) {
      nameError.value = 'This name is already taken';
      return false;
    }
    nameError.value = '';
    return true;
  } catch (err) {
    console.error('Frontend - Error checking name:', err);
    nameError.value = 'Failed to check name availability';
    return false;
  } finally {
    checkingName.value = false;
  }
}

function validateName() {
  const value = name.value.trim()
  nameError.value = ''
  
  if (value.length < 2) {
    return false
  }
  if (value.length > 50) {
    nameError.value = 'Name must be less than 50 characters'
    return false
  }

  // Simple URL-safe check
  if (!/^[a-zA-Z0-9\s\-_]+$/.test(value)) {
    nameError.value = 'Name can only contain letters, numbers, spaces, hyphens, and underscores'
    return false
  }

  return true
}

async function onNameInput() {
  if (validateName()) {
    if (nameCheckTimeout) {
      clearTimeout(nameCheckTimeout)
    }
    nameCheckTimeout = window.setTimeout(async () => {
      await checkNameExists(name.value.trim())
    }, 1300)
  }
}

async function onSubmit() {
  formError.value = ''
  if (props.mode === 'register') {
    if (!validateName()) {
      return;
    }
    // Final check for name existence before submission
    const isNameAvailable = await checkNameExists(name.value.trim());
    if (!isNameAvailable) {
      return;
    }
  }
  try {
    emit('submit', { 
      name: name.value.trim(),
      email: email.value, 
      password: password.value,
      bio: bio.value,
      role_id: 1 // Default role for new users
    });
  } catch (err: any) {
    formError.value = err?.message || 'An error occurred. Please try again.'
  }
}
</script>

<style scoped>
.input {
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
.exclamation-circle {
  transform: translateY(-50%);
}
</style> 