import axios, { type AxiosInstance } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { cacheService } from '@/plugins/cache'

class ApiConfig {
  private static instance: ApiConfig
  private readonly baseUrl: string
  private readonly api: AxiosInstance

  private constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    if (!this.baseUrl.startsWith('http')) {
      console.error('Invalid API URL:', this.baseUrl)
      throw new Error('Invalid API URL configuration')
    }
    this.baseUrl = this.baseUrl.replace(/\/$/, '')
    this.api = axios.create({
      baseURL: `${this.baseUrl}/api/`,
      timeout: 30000,
      validateStatus: (status) => status >= 200 && status < 300,
      withCredentials: true
    })
    this.api.interceptors.response.use(
      response => {
        if (response.config.method === 'get') {
          const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`
          cacheService.set(cacheKey, response.data, 5 * 60 * 1000)
        }
        return response
      },
      error => Promise.reject(error)
    )
    this.api.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          const auth = useAuthStore()
          auth.logout()
        }
        return Promise.reject(error)
      }
    )
    this.api.interceptors.request.use(config => {
      const token = localStorage.getItem('jwt');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }
  public static getInstance(): ApiConfig {
    if (!ApiConfig.instance) {
      ApiConfig.instance = new ApiConfig()
    }
    return ApiConfig.instance
  }
  public getApi(): AxiosInstance {
    return this.api
  }
  public getBaseUrl(): string {
    return this.baseUrl
  }
  public getEndpoint(path: string): string {
    const cleanPath = path.replace(/^\/\/+/, '')
    return `${this.baseUrl}/api/${cleanPath}`
  }
}

export const apiConfig = ApiConfig.getInstance()
export const api = apiConfig.getApi()
export { ApiConfig } 