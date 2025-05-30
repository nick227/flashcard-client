export const VALIDATION_LIMITS = {
  THUMBNAIL: {
    MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
    MAX_SIZE_MB: 10,
    MAX_WIDTH: 1024,
    MAX_HEIGHT: 1024,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  },
  CARD: {
    MAX_CHARS: 2000
  }
} as const 