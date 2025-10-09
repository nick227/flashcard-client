import { api, apiEndpoints } from './index'
import type { Category, CategoryWithSets } from './types' 

export async function fetchCategories(inUseOnly: boolean = false): Promise<Category[]> {
  try {
    const params = inUseOnly ? { inUse: 'true' } : undefined;
    const res = await api.get(apiEndpoints.categories, { params });
    // Backend wraps in ApiResponse.success({ data: [...] })
    const responseData = res.data?.data || res.data;
    return Array.isArray(responseData) ? responseData : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }
}

export async function fetchRandomCategoriesWithSets(limit: number = 4, setsPerCategory: number = 5): Promise<CategoryWithSets[]> {
  try {
    const res = await api.get(apiEndpoints.categoriesRandomWithSets(limit, setsPerCategory));
    // Backend wraps in ApiResponse.success({ data: [...] })
    const responseData = res.data?.data || res.data;
    return Array.isArray(responseData) ? responseData : [];
  } catch (error) {
    console.error('Error fetching random categories with sets:', error);
    throw new Error('Failed to fetch random categories with sets');
  }
} 