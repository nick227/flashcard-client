<template>
  <div class="flex flex-col items-center justify-start pb-16">
    <div class="container flex flex-col items-center w-full flex-1 justify-start">
      <div class="flex flex-colpt-44 pb-4 max-w-[460px]">
        <div class="flex flex-col items-center w-full">
          <h1 class="font-bold mb-2 site-title">Flashcard Academy</h1>
          <p class="mb-6 text-gray-600">{{ mode === 'login' ? 'Existing Members' : 'New Users' }}</p>
          <AuthToggle :mode="mode" @update:mode="mode = $event" />
          <AuthForm :mode="mode" @submit="onSubmit" :loading="loading">
            <template #description>
              <div v-if="mode === 'login'" class="text-blue-700 text-center text-base mb-2">
                {{ randomIntroText }}
              </div>
              <div v-else class="text-green-700 text-center text-base mb-2">
                {{ randomIntroText }}
              </div>
            </template>
            <template #error>
              <div v-if="error" class="text-red-600 text-sm mb-2 text-center">{{ error }}</div>
            </template>
          </AuthForm>
          
          <!--
          <div class="divider my-6 flex items-center w-full">
            <div class="flex-1 h-px bg-gray-200"></div>
            <span class="mx-4 text-gray-400 text-sm">or</span>
            <div class="flex-1 h-px bg-gray-200"></div>
          </div>
          <GoogleLogin /> 
          -->
          
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import AuthToggle from '@/components/auth/AuthToggle.vue'
import AuthForm from '@/components/auth/AuthForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const STORAGE_KEY = 'auth_view_mode'
type AuthMode = 'login' | 'register'

// Validate mode value
function isValidAuthMode(value: string): value is AuthMode {
  return value === 'login' || value === 'register'
}

const mode = ref<AuthMode>('register') // Default to register
const error = ref('')
const loading = ref(false)
const auth = useAuthStore()
const router = useRouter()

// Load saved mode from localStorage on mount
onMounted(() => {
  try {
    const savedMode = localStorage.getItem(STORAGE_KEY)
    if (savedMode && isValidAuthMode(savedMode)) {
      mode.value = savedMode
    }
  } catch (err) {
    console.error('Error loading auth mode from localStorage:', err)
    // Fallback to default mode if there's an error
    mode.value = 'register'
  }
})

// Watch for mode changes and save to localStorage
watch(mode, (newMode) => {
  try {
    localStorage.setItem(STORAGE_KEY, newMode)
  } catch (err) {
    console.error('Error saving auth mode to localStorage:', err)
  }
})

const onSubmit = async (formData: { email: string; password: string; name?: string; bio?: string }) => {
  try {
    loading.value = true
    error.value = ''

    if (mode.value === 'login') {
      await handleLogin(formData)
    } else {
      await handleRegister(formData)
    }
  } catch (err: any) {
    console.error('Auth error:', err)
    error.value = err.response?.data?.error || err.message || 'Authentication failed'
  } finally {
    loading.value = false
  }
}

async function handleLogin(formData: { email: string; password: string }) {
  try {
    await auth.login({
      email: formData.email,
      password: formData.password
    })
    router.push('/')
  } catch (error) {
    console.error('Login failed:', error)
  }
}

const handleRegister = async (formData: { email: string; password: string; name?: string; bio?: string }) => {
  if (!formData.name || !formData.email || !formData.password) {
    auth.setMessage('Please fill in all fields')
    return
  }

  try {
    await auth.register({
      name: formData.name || '',
      email: formData.email,
      password: formData.password
    })
    router.push('/')
  } catch (error) {
    console.error('Registration failed:', error)
  }
}

const introTexts = [
  'Sign in to access your flashcards and inner peace.',
  'Bruh, I mean like, flashcards you know?',
  'What is the sound of one hand clapping?',
  'The smartest geniuses use flashcards.',
  'If only everything was as simple as flashcards.',
  'These flashcards are tripping me out.',
  'Flashcards are super-cool daddy-o.',
  'I\'m about to ace this test with flashcards.',
  'I am flashcard legend.',
  'So two flashcards walk into a bar...',
  'You get a flashcard, you get a flashcard!',
  'It  was a dark and stormy night...',
  'Life, universe, time, and flashcards.',
]

const randomIntroText = computed(() => {
  return introTexts[Math.floor(Math.random() * introTexts.length)]
})
</script>
