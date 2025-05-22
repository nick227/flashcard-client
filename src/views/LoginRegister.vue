<template>
  <Navbar />
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div class="container flex flex-col md:flex-row items-stretch overflow-hidden items-center w-full flex-1 justify-center pt-64">
      <div class="flex flex-colpt-44 pb-64 max-w-[460px]">
        <div class="flex flex-col items-center w-full">
          <h1 class="text-3xl font-bold mb-2">Flashcard Academy</h1>
          <p class="mb-6 text-gray-600">{{ mode === 'login' ? 'Sign in to access your account.' : 'Create an account to start your progress.' }}</p>
          <AuthToggle :mode="mode" @update:mode="mode = $event" />
          <AuthForm :mode="mode" @submit="onSubmit" :loading="loading">
            <template #description>
              <div v-if="mode === 'login'" class="text-blue-700 text-center text-base mb-2">
                Sign in to access your flashcards and inner peace.
              </div>
              <div v-else class="text-green-700 text-center text-base mb-2">
                Create an account to start your flash card journey.
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
import { ref } from 'vue'
import Navbar from '@/components/common/Navbar.vue'
import AuthToggle from '@/components/auth/AuthToggle.vue'
import AuthForm from '@/components/auth/AuthForm.vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const mode = ref<'login' | 'register'>('login')
const error = ref('')
const loading = ref(false)
const auth = useAuthStore()
const router = useRouter()

const onSubmit = async (formData: { email: string; password: string; name?: string }) => {
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
        role_id: 2 // Default to user role
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
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
.divider {
  width: 100%;
  display: flex;
  align-items: center;
  margin: 1.5rem 0;
}
@media (max-width: 767px) {
  .max-h-\[480px\] {
    max-height: 220px;
  }
}
</style> 