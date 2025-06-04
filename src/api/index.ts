// API layer placeholder
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

// Ensure we have a valid API URL
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Validate the base URL
if (!BASE_URL.startsWith('http')) {
  console.error('Invalid API URL:', BASE_URL);
  throw new Error('Invalid API URL configuration');
}

console.log('API Base URL:', BASE_URL); // Debug log

export const apiEndpoints = {
  baseUrl: BASE_URL,
  sets: `${BASE_URL}/api/sets`,
  cards: `${BASE_URL}/api/cards`,
  users: `${BASE_URL}/api/users`,
  userLikes: `${BASE_URL}/api/userLikes`,
  purchases: `${BASE_URL}/api/purchases`,
  subscriptions: `${BASE_URL}/api/subscriptions`,
  checkout: `${BASE_URL}/api/checkout`,
  sales: `${BASE_URL}/api/sales`,
  history: `${BASE_URL}/api/history`,
};

// Create axios instance with proper configuration
export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  validateStatus: (status) => status >= 200 && status < 300
});

// Add request interceptor to automatically add auth token
api.interceptors.request.use(
  (config) => {
    const auth = useAuthStore();
    if (auth.jwt) {
      config.headers.Authorization = `Bearer ${auth.jwt}`;
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore();
      auth.logout();
      auth.setMessage('Session expired. Please log in again.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Creates a new set and its cards in the backend.
 * @param formData - The form data containing the set and cards
 * @param onProgress - Optional progress callback
 * @returns The created set and cards
 */
export async function createSetWithCards(formData: FormData) {
  try {
    const response = await axios.post(apiEndpoints.sets, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 300000, // 5 minutes for development
      maxContentLength: 5 * 1024 * 1024, // 5MB max
      validateStatus: (status) => status >= 200 && status < 300
    });

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
    console.log('Frontend: Starting set update for ID:', setId);
    console.log('Frontend: FormData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0], pair[1]);
    }

    const response = await axios.put(`${apiEndpoints.sets}/${setId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000, // 30 second timeout
      maxContentLength: 5 * 1024 * 1024, // 5MB max
      validateStatus: (status) => status >= 200 && status < 300
    });

    console.log('Frontend: Update response:', response.data);
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

/**
 * Fetch categories from the backend.
 * @param inUseOnly - Optional parameter to fetch only categories that are in use by sets. Defaults to false (all categories).
 * @returns Promise with array of categories { id: number, name: string }
 */
export async function fetchCategories(inUseOnly: boolean = false): Promise<{ id: number; name: string }[]> {
  try {
    const params = inUseOnly ? { inUse: 'true' } : undefined;
    const res = await api.get('/categories', { params });
    return res.data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }
}

/**
 * Fetch unique tags from sets (if sets have tags array), else fallback to static tags.
 */
export async function fetchAvailableTags() {
  const res = await api.get('/tags')
  return res.data.map((tag: { id: number, name: string }) => tag.name)
}

/**
 * Fetch all tags from the backend.
 * Returns array of { id, name }
 */
export async function fetchTags() {
  const res = await api.get('/tags');
  return res.data; // Expecting [{ id, name }, ...]
}

export async function assignTagsToSet(setId: number, tags: string[]) {
  return api.post('/set_tags', { setId, tags });
}

export async function removeTagFromSet(setId: number, tagName: string) {
  return api.post(`/sets/${setId}/remove-tag`, { setId, tagName });
} 

