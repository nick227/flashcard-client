export function buildQueryString(params: Record<string, any>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      search.append(key, String(value))
    }
  })
  const str = search.toString()
  return str ? `?${str}` : ''
} 