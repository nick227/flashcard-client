<template>
  <div>
    <GoogleLogin
      v-if="!isAuthenticated"
      :callback="callback"
      popup-type="ID_TOKEN"
      class="button"
      prompt
      auto-login
      @error="handleError"
      @success="handleSuccess"
    >Login with Google</GoogleLogin>
    <div v-else-if="user" class="flex items-center gap-2">
      <img :src="user?.image" alt="User" class="w-8 h-8 rounded-full" />
      <span>{{ user?.name }}</span>
      <button class="button" @click="logout" aria-label="Logout">Logout</button>
    </div>
    <div v-else>
      <button class="button" @click="logout">Logout (reset)</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'
import { useToaster } from '@/composables/useToaster'
import { decodeCredential } from 'vue3-google-login'

const auth = useAuthStore()
const user = computed(() => auth.user)
const isAuthenticated = computed(() => auth.isAuthenticated)
const { toast } = useToaster()

type GoogleUser = {
  sub: string
  name: string
  email: string
  picture: string
}

function setUser(userObj: any, token: string) {
  console.log('Setting user data:', { userObj, token })
  auth.user = userObj
  auth.jwt = token
  localStorage.setItem('jwt', token)
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  localStorage.setItem('user', JSON.stringify(userObj))
  console.log('User data set successfully')
}

function clearUser() {
  console.log('Clearing user data')
  auth.logout()
}

function handleError(error: any) {
  console.error('Google login error:', error)
  toast('Google login failed: ' + (error.message || 'Unknown error'), 'error')
}

function handleSuccess(response: any) {
  console.log('Google login success event:', response)
}

async function callback(response: any) {
  console.log('GoogleLogin callback called. Full response:', response)
  if (response.credential) {
    try {
      console.log('Decoding credential...');
      const userData = decodeCredential(response.credential) as GoogleUser
      console.log("Decoded user data:", userData)
      
      // Test if we can at least decode the credential
      toast('Google login successful! Decoding credential...', 'success')
      
      // Call our backend to handle Google auth
      const authResponse = await axios.post('/auth/google', {
        googleId: userData.sub,
        email: userData.email,
        name: userData.name,
        image: userData.picture
      });
      console.log('Backend response:', authResponse.data);

      // Set user with our JWT
      setUser(authResponse.data.user, authResponse.data.token)
      toast('Login successful!', 'success')
    } catch (error: any) {
      console.error('Google login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      })
      toast('Login failed. Please try again.', 'error')
    }
  } else {
    console.warn("No credential in response", response)
    toast('Login failed: No credential received.', 'error')
  }
}

function logout() {
  clearUser()
  toast('Logged out.', 'info')
}

// Log initial state
console.log('GoogleLogin.vue: Initial state:', {
  user: user.value,
  isAuthenticated: isAuthenticated.value,
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID
})
</script> 