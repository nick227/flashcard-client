// All API endpoint string construction

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