export type MediaType = 'text' | 'image' | 'youtube' | 'link'

export function useMediaUtils() {
  const isYouTubeUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    // Remove @ prefix if present and trim
    const cleanUrl = url.replace(/^@/, '').trim()
    return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(cleanUrl)
  }

  const getYouTubeEmbedUrl = (url: string): string => {
    // Remove @ prefix if present and trim
    const cleanUrl = url.replace(/^@/, '').trim()
    const match = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)
    return match ? `https://www.youtube.com/embed/${match[1]}` : cleanUrl
  }

  const isImageUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    return url.includes('cloudinary.com') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)
  }

  const isWebUrl = (url: string | null | undefined): boolean => {
    if (!url) return false
    return /^https?:\/\//i.test(url)
  }

  const getMediaType = (text: string | null | undefined): MediaType => {
    if (!text) return 'text'
    if (isImageUrl(text)) return 'image'
    if (isYouTubeUrl(text)) return 'youtube'
    if (isWebUrl(text)) return 'link'
    return 'text'
  }

  return {
    isYouTubeUrl,
    getYouTubeEmbedUrl,
    isImageUrl,
    isWebUrl,
    getMediaType
  }
} 