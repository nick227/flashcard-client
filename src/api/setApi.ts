import { api, apiEndpoints } from './index'

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
    // NOTE: Cache invalidation should be handled by the caller (composable/component)
    return response.data;
  } catch (error) {
    if (error instanceof Error && 'isAxiosError' in error && (error as any).isAxiosError) {
      const axiosError = error as any;
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error('Upload timed out. Please try again.');
      }
      if (axiosError.response?.status === 413) {
        throw new Error('File too large. Maximum size is 5MB.');
      }
      if (axiosError.response?.data?.error) {
        throw new Error(axiosError.response.data.error);
      }
      throw new Error('Network error. Please check your connection.');
    }
    throw new Error('Failed to create set. Please try again.');
  }
}

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
    // NOTE: Cache invalidation should be handled by the caller (composable/component)
    return response.data;
  } catch (error) {
    if (error instanceof Error && 'isAxiosError' in error && (error as any).isAxiosError) {
      const axiosError = error as any;
      if (axiosError.code === 'ECONNABORTED') {
        throw new Error('Upload timed out. Please try again.');
      }
      if (axiosError.response?.status === 413) {
        throw new Error('File too large. Maximum size is 5MB.');
      }
      if (axiosError.response?.data?.error) {
        throw new Error(axiosError.response.data.error);
      }
      throw new Error('Network error. Please check your connection.');
    }
    throw new Error('Failed to update set. Please try again.');
  }
}

export async function assignTagsToSet(setId: number, tags: string[]) {
  const response = await api.post(apiEndpoints.setTags, { setId, tags });
  // NOTE: Cache invalidation should be handled by the caller (composable/component)
  return response;
}

export async function removeTagFromSet(setId: number, tagName: string) {
  const response = await api.post(`${apiEndpoints.sets.base}/${setId}/remove-tag`, { setId, tagName });
  // NOTE: Cache invalidation should be handled by the caller (composable/component)
  return response;
} 