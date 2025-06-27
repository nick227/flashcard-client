import { api, apiEndpoints } from './index'
import axios from 'axios'

export async function login(credentials: { email: string; password: string }) {
  try {
    const response = await api.post(apiEndpoints.auth.login, credentials)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error('Invalid credentials')
      }
      throw new Error(error.response?.data?.message || 'Login failed')
    }
    throw error
  }
}

export async function register(userData: { name: string; email: string; password: string; role_id: number; bio?: string }) {
  try {
    const response = await api.post(apiEndpoints.auth.register, userData)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 409) {
        throw new Error('Email already registered')
      }
      throw new Error(error.response?.data?.error || 'Registration failed')
    }
    throw error
  }
}

export async function logout() {
  try {
    await api.post(apiEndpoints.auth.logout)
  } catch (error) {
    // Don't throw on logout failure - just log it
    console.error('Logout error:', error)
  }
}

export async function checkAuth() {
  try {
    const response = await api.get(apiEndpoints.auth.me)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return null
      }
      throw new Error(error.response?.data?.message || 'Auth check failed')
    }
    throw error
  }
} 