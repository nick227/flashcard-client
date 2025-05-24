<template>
  <div class="min-h-screen flex flex-col items-center justify-start bg-gray-50">
    <div class="container flex flex-col items-center w-full flex-1 justify-start">
      <div class="flex flex-colpt-44 pb-64 max-w-[460px]">
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
          </div><GoogleLogin /> 
          -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AuthToggle from '@/components/auth/AuthToggle.vue'
import AuthForm from '@/components/auth/AuthForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const mode = ref<'login' | 'register'>('login')
const error = ref('')
const loading = ref(false)
const auth = useAuthStore()
const router = useRouter()

const onSubmit = async (formData: { email: string; password: string; name?: string; bio?: string }) => {
  try {
    loading.value = true
    error.value = ''

    if (mode.value === 'login') {
      await auth.login(formData.email, formData.password)
    } else {
      await auth.register({
        name: formData.name || '',
        email: formData.email,
        password: formData.password,
        role_id: 2, // Default to user role
        bio: formData.bio || ''
      })
    }

    router.push('/profile')
  } catch (err: any) {
    console.error('Auth error:', err)
    error.value = err.response?.data?.error || err.message || 'Authentication failed'
  } finally {
    loading.value = false
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
