// API layer placeholder
import axios from 'axios'
import type { AxiosInstance } from 'axios'
import { useAuthStore } from '@/stores/auth'
import { cacheService } from '@/plugins/cache'

// API Configuration Singleton
class ApiConfig {
  private static instance: ApiConfig
  private readonly baseUrl: string
  private readonly api: AxiosInstance

  private constructor() {
    // Ensure we have a valid API URL
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
    
    // Validate the base URL
    if (!this.baseUrl.startsWith('http')) {
      console.error('Invalid API URL:', this.baseUrl)
      throw new Error('Invalid API URL configuration')
    }

    // Remove trailing slash if present
    this.baseUrl = this.baseUrl.replace(/\/$/, '')

    console.log('API Base URL:', this.baseUrl)

    // Create axios instance with better error handling
    this.api = axios.create({
      baseURL: `${this.baseUrl}/api/`,
      timeout: 30000,
      validateStatus: (status) => status >= 200 && status < 300,
      withCredentials: true
    })

    // Add cache service to axios instance
    this.api.interceptors.response.use(
      response => {
        // Cache successful GET requests
        if (response.config.method === 'get') {
          const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`
          cacheService.set(cacheKey, response.data, 5 * 60 * 1000) // 5 minutes
        }
        return response
      },
      error => Promise.reject(error)
    )

    // Add error interceptor
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
    // Remove any leading slashes to prevent double slashes
    const cleanPath = path.replace(/^\/+/, '')
    return `${this.baseUrl}/api/${cleanPath}`
  }
}

// Export singleton instance
export const apiConfig = ApiConfig.getInstance()

// Export axios instance
export const api = apiConfig.getApi()

// API Endpoints
export const apiEndpoints = {
  stockImages: 'stock-images',
  auth: {
    login: 'auth/login',
    logout: 'auth/logout',
    me: 'auth/me',
    register: 'auth/register',
    refresh: 'auth/refresh'
  },
  sets: {
    base: 'sets',
    count: 'sets/count',
    likes: (setId: number) => `sets/${setId}/likes`,
    userLikes: (setId: number) => `sets/${setId}/likes/user`,
    batch: (type: string) => `sets/batch/${type}`,
    toggleLike: (setId: number) => `sets/${setId}/like`,
    getUserLikes: (userId: number) => `sets/liked?userId=${userId}`
  },
  cards: 'cards',
  users: 'users',
  userLikes: 'user-likes',
  purchases: 'purchases',
  subscriptions: 'subscriptions',
  checkout: 'checkout',
  sales: 'sales',
  history: {
    base: 'history',
    user: (userId: number) => `history/user/${userId}`,
    set: (setId: number) => `history/set/${setId}`
  },
  categories: 'categories',
  categoriesRandomWithSets: (limit?: number, setsPerCategory?: number) => {
    const params = new URLSearchParams()
    if (limit !== undefined) params.append('limit', limit.toString())
    if (setsPerCategory !== undefined) params.append('setsPerCategory', setsPerCategory.toString())
    return `categories/random-with-sets${params.toString() ? `?${params.toString()}` : ''}`
  },
  tags: 'tags',
  setTags: 'set-tags'
}

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  return apiConfig.getEndpoint(endpoint)
}

// Auth API functions
export const authApi = {
  async login(credentials: { email: string; password: string }) {
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
  },

  async register(userData: { name: string; email: string; password: string; role_id: number; bio?: string }) {
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
  },

  async logout() {
    try {
      await api.post(apiEndpoints.auth.logout)
    } catch (error) {
      // Don't throw on logout failure - just log it
      console.error('Logout error:', error)
    }
  },

  async checkAuth() {
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
}

/**
 * Fetch categories from the backend.
 * @param inUseOnly - Optional parameter to fetch only categories that are in use by sets. Defaults to false (all categories).
 * @returns Promise with array of categories { id: number, name: string, setCount: number }
 */
export async function fetchCategories(inUseOnly: boolean = false): Promise<{ id: number; name: string; setCount: number }[]> {
  try {
    const params = inUseOnly ? { inUse: 'true' } : undefined;
    const res = await api.get(apiEndpoints.categories, { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }
}

/**
 * Fetch random categories with their sets for landing page.
 * @param limit - Number of categories to return (default: 4)
 * @param setsPerCategory - Number of sets per category (default: 5)
 * @returns Promise with array of categories with sets
 */
export async function fetchRandomCategoriesWithSets(limit: number = 4, setsPerCategory: number = 5): Promise<Array<{
  id: number;
  name: string;
  sets: Array<{
    id: number;
    title: string;
    description: string;
    thumbnail: string | null;
    price: number;
    isSubscriberOnly: boolean;
    educator: {
      id: number;
      name: string;
      image: string | null;
    } | null;
  }>;
}>> {
  try {
    const res = await api.get(apiEndpoints.categoriesRandomWithSets(limit, setsPerCategory));
    return res.data;
  } catch (error) {
    console.error('Error fetching random categories with sets:', error);
    throw new Error('Failed to fetch random categories with sets');
  }
}

/**
 * Fetch unique tags from sets (if sets have tags array), else fallback to static tags.
 */
export async function fetchAvailableTags() {
  const res = await api.get(apiEndpoints.tags);
  return res.data.map((tag: { id: number, name: string }) => tag.name);
}

/**
 * Fetch all tags from the backend.
 * Returns array of { id, name }
 */
export async function fetchTags() {
  const res = await api.get(apiEndpoints.tags);
  return res.data;
}

export async function assignTagsToSet(setId: number, tags: string[]) {
  const response = await api.post(apiEndpoints.setTags, { setId, tags });
  // Invalidate tags cache after modification
  cacheService.deleteByPrefix('tags:');
  return response;
}

export async function removeTagFromSet(setId: number, tagName: string) {
  const response = await api.post(`${apiEndpoints.sets.base}/${setId}/remove-tag`, { setId, tagName });
  // Invalidate tags cache after modification
  cacheService.deleteByPrefix('tags:');
  return response;
}

/**
 * Creates a new set and its cards in the backend.
 * @param formData - The form data containing the set and cards
 * @returns The created set and cards
 */
export async function createSetWithCards(formData: FormData) {
  try {
    const response = await api.post(apiEndpoints.sets.base, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 300000, // 5 minutes for development
      maxContentLength: 5 * 1024 * 1024, // 5MB max
      validateStatus: (status) => status >= 200 && status < 300
    });

    // Invalidate sets cache after creation
    cacheService.deleteByPrefix('sets:');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timed out. Please try again.');
      }
      if (error.response?.status === 413) {
        throw new Error('File too large. Maximum size is 5MB.');
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Network error. Please check your connection.');
    }
    throw new Error('Failed to create set. Please try again.');
  }
}

/**
 * Updates an existing set and its cards in the backend.
 * @param setId - The ID of the set to update
 * @param formData - The form data containing the set and cards
 * @returns The updated set and cards
 */
export async function updateSetWithCards(setId: number, formData: FormData) {
  try {

    const response = await api.put(`${apiEndpoints.sets.base}/${setId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000, // 30 second timeout
      maxContentLength: 5 * 1024 * 1024, // 5MB max
      validateStatus: (status) => status >= 200 && status < 300
    });

    // Invalidate sets cache after update
    cacheService.deleteByPrefix('sets:');
    return response.data;
  } catch (error) {
    console.error('Frontend: Update error:', error);
    if (axios.isAxiosError(error)) {
      console.error('Frontend: Error response:', error.response?.data);
      console.error('Frontend: Error status:', error.response?.status);
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timed out. Please try again.');
      }
      if (error.response?.status === 413) {
        throw new Error('File too large. Maximum size is 5MB.');
      }
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      throw new Error('Network error. Please check your connection.');
    }
    throw new Error('Failed to update set. Please try again.');
  }
}