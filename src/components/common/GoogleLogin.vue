<template>
  <div>
    <GoogleLogin
      v-if="!isAuthenticated"
      :callback="callback"
      popup-type="ID_TOKEN"
      class="button"
      prompt
      auto-login
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
import { ref, computed } from 'vue'
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
  auth.jwt = token
  localStorage.setItem('jwt', token)
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
  auth.user = userObj
  localStorage.setItem('user', JSON.stringify(userObj))
}

function clearUser() {
  auth.logout()
}

function callback(response: any) {
  console.log('GoogleLogin callback called. Full response:', response)
  if (response.credential) {
    const userData = decodeCredential(response.credential) as GoogleUser
    console.log("User data:", userData)
    const userObj = {
      id: userData.sub,
      name: userData.name,
      email: userData.email,
      image: userData.picture,
    }
    setUser(userObj, response.credential)
    console.log('User set:', userObj)
    axios.post('/users', userObj).catch(() => {})
    toast('Login successful!', 'success')
  } else {
    console.warn("No credential in response", response)
    toast('Login failed: No credential received.', 'error')
  }
}

function logout() {
  clearUser()
  toast('Logged out.', 'info')
}

console.log('GoogleLogin.vue: user', user.value)
console.log('GoogleLogin.vue: isAuthenticated', isAuthenticated.value)
</script> 