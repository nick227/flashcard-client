// API index: central export for all API utilities and domain APIs

import { api, apiConfig } from './axiosInstance'
import { apiEndpoints } from './endpoints'
import * as cacheService from '@/services/cacheService'
import * as apiTypes from './types'
import { handleApiError } from './errorHandler'
import { buildQueryString } from '@/utils/buildQueryString'

// Domain APIs
import { login, register, logout, checkAuth } from './authApi'
import { createSetWithCards, updateSetWithCards, assignTagsToSet, removeTagFromSet } from './setApi'
import { fetchCategories, fetchRandomCategoriesWithSets } from './categoryApi'
import { fetchAvailableTags, fetchTags } from './tagApi'
// (Add other domain APIs as you refactor)

// Export all helpers and domain APIs
export {
  api,
  apiConfig,
  apiEndpoints,
  cacheService,
  apiTypes,
  handleApiError,
  buildQueryString,
  // Auth
  login,
  register,
  logout,
  checkAuth,
  // Sets
  createSetWithCards,
  updateSetWithCards,
  assignTagsToSet,
  removeTagFromSet,
  // Categories
  fetchCategories,
  fetchRandomCategoriesWithSets,
  // Tags
  fetchAvailableTags,
  fetchTags
  // Add other domain exports here
}

// Compatibility exports for original API objects
export const authApi = { login, register, logout, checkAuth }
export const setApi = { createSetWithCards, updateSetWithCards, assignTagsToSet, removeTagFromSet }
export const getApiUrl = (endpoint: string): string => apiConfig.getEndpoint(endpoint)

export const categoryApi = { fetchCategories, fetchRandomCategoriesWithSets }
export const tagApi = { fetchAvailableTags, fetchTags }

// Named type exports for backward compatibility
export type { Tag, Category, CategoryWithSets, Set, SetEducator, AuthCredentials, AuthRegisterPayload } from './types'