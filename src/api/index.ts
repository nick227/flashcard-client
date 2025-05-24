// API layer placeholder
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiEndpoints = {
  baseUrl: BASE_URL,
  sets: `${BASE_URL}/sets`,
  cards: `${BASE_URL}/cards`,
  users: `${BASE_URL}/users`,
  userLikes: `${BASE_URL}/userLikes`,
  purchases: `${BASE_URL}/purchases`,
  subscriptions: `${BASE_URL}/subscriptions`,
  checkout: `${BASE_URL}/checkout`,
  sales: `${BASE_URL}/sales`,
  history: `${BASE_URL}/history`,
};

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
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
      timeout: 30000, // 30 second timeout
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
 * Fetch unique categories from sets.
 */
export async function fetchCategories(): Promise<{ id: number; name: string }[]> {
  const res = await api.get('/categories');
  return res.data;
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

