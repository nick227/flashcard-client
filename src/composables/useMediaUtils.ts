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

  return {
    isYouTubeUrl,
    getYouTubeEmbedUrl
  }
} 