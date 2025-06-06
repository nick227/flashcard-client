<template>
  <div class="newsletter">
    <div v-if="showEmailError" class="email-error">Please enter a valid email address.</div>
    <div v-if="showNotification && newsletterStatus === 'success'" class="newsletter-success">{{ newsletterMessage }}</div>
    <div v-if="showNotification && newsletterStatus === 'error'" class="newsletter-error">{{ newsletterMessage }}</div>
    <div v-if="showNotification && newsletterStatus === 'exists'" class="newsletter-exists">{{ newsletterMessage }}</div>
    <form @submit.prevent="subscribeNewsletter" class="newsletter-form" novalidate>
      <label for="newsletter-email" class="sr-only">Email</label>
      <input
        id="newsletter-email"
        type="email"
        name="email"
        v-model="email"
        placeholder="Subscribe to our newsletter"
        :class="{ 'input-error': showEmailError }"
        @blur="onBlur"
        @input="onInput"
        required
        autocomplete="email"
      />
      <button class="button" type="submit" :disabled="newsletterLoading || !isEmailValid">
        <i class="fas fa-paper-plane"></i>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { api } from '@/api'

const email = ref('')
const emailTouched = ref(false)
const newsletterStatus = ref<'idle'|'success'|'error'|'exists'>('idle')
const newsletterMessage = ref('')
const newsletterLoading = ref(false)
const showNotification = ref(false)
let notificationTimeout: ReturnType<typeof setTimeout> | null = null

const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const isEmailValid = computed(() => emailRegex.test(email.value.trim()))

// Throttle error display
const showEmailError = ref(false)
let errorTimeout: ReturnType<typeof setTimeout> | null = null

const onInput = () => {
  if (emailTouched.value) newsletterStatus.value = 'idle'
  showNotification.value = false
  // Throttle error display: only show error if user stops typing for 500ms
  if (errorTimeout) clearTimeout(errorTimeout)
  errorTimeout = setTimeout(() => {
    showEmailError.value = emailTouched.value && !isEmailValid.value && email.value.length > 0
  }, 500)
}

const onBlur = () => {
  emailTouched.value = true
  // Show error immediately on blur if invalid
  showEmailError.value = !isEmailValid.value && email.value.length > 0
}

const clearNotification = () => {
  showNotification.value = false
  newsletterStatus.value = 'idle'
  newsletterMessage.value = ''
}

const subscribeNewsletter = async () => {
  emailTouched.value = true
  if (!isEmailValid.value) {
    showEmailError.value = true
    return
  }
  newsletterStatus.value = 'idle'
  newsletterMessage.value = ''
  newsletterLoading.value = true
  showNotification.value = false
  try {
    const res = await api.post('/newsletter/subscribe', { email: email.value.trim() })
    newsletterStatus.value = 'success'
    newsletterMessage.value = 'Subscribed! Rock and Roll!'
    email.value = ''
    emailTouched.value = false
  } catch (err: any) {
    if (err.response?.status === 409) {
      newsletterStatus.value = 'exists'
      newsletterMessage.value = 'You already subscribed.'
    } else {
      newsletterStatus.value = 'error'
      newsletterMessage.value = 'Something failed. What?!'
    }
  } finally {
    newsletterLoading.value = false
    showNotification.value = true
    if (notificationTimeout) clearTimeout(notificationTimeout)
    notificationTimeout = setTimeout(clearNotification, 5000)
  }
}
</script>

<style scoped>
.newsletter {
  @apply flex flex-col gap-2;
}
.newsletter-form {
  @apply flex gap-2 items-center;
}
.newsletter-form input {
  @apply flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-150;
  background: #fff;
}
.newsletter-form input.input-error {
  @apply border-red-400 ring-0;
  background: #fff6f6;
}
.button {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center;
}
.email-error {
  @apply text-red-500 text-xs mt-1 ml-1;
}
.newsletter-success {
  @apply text-green-600 text-sm mt-2;
}
.newsletter-error {
  @apply text-red-600 text-sm mt-2;
}
.newsletter-exists {
  @apply text-yellow-600 text-sm mt-2;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style> 