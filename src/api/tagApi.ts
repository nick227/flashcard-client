import { api, apiEndpoints } from './index'
import type { Tag } from './types'

export async function fetchAvailableTags(): Promise<string[]> {
  const res = await api.get(apiEndpoints.tags);
  return res.data.map((tag: Tag) => tag.name);
}

export async function fetchTags(): Promise<Tag[]> {
  const res = await api.get(apiEndpoints.tags);
  return res.data;
} 