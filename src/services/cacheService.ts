// Simple in-memory cache service for API responses

const cache = new Map<string, { value: any, expires: number }>()

export function set(key: string, value: any, ttl: number) {
  cache.set(key, { value, expires: Date.now() + ttl })
}

export function get(key: string) {
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() > entry.expires) {
    cache.delete(key)
    return undefined
  }
  return entry.value
}

export function deleteByPrefix(prefix: string) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

export function clear() {
  cache.clear()
} 