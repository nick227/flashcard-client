// useMediaEmbed.ts
// Reusable media/text handling composable for embedding YouTube, images, and links
// WARNING: If you ever allow user input, sanitize before using v-html to prevent XSS.

/**
 * Extracts a YouTube video ID from a URL.
 * Supports standard, short, and embed URLs.
 * @param url - The YouTube URL
 * @returns The video ID or null
 */
export function extractVideoId(url: string): string | null {
  // Match v=VIDEO_ID in query string
  const vMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/)
  if (vMatch) return vMatch[1]
  // Match youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)
  if (shortMatch) return shortMatch[1]
  // Match /embed/VIDEO_ID
  const embedMatch = url.match(/embed\/([a-zA-Z0-9_-]{11})/)
  if (embedMatch) return embedMatch[1]
  return null
}

/**
 * Detects and returns HTML for YouTube, image, or URL embeds.
 * @param text - The input text
 * @returns HTML string for embed, or false if not matched
 */
export function mediaCheck(text: string): string | false {
  // YouTube: standard, short, or embed
  const ytRegex = /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/
  const ytMatch = text.match(ytRegex)
  if (ytMatch) {
    const videoId = extractVideoId(text)
    if (videoId) {
      return `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
    }
  }

  // Image: common image extensions
  const imageRegex = /(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))/i
  if (imageRegex.test(text.trim())) {
    return `<img src="${text.trim()}" alt="Embedded image" />`
  }

  // Any other valid URL
  const urlRegex = /(https?:\/\/[\S]+)/g
  if (urlRegex.test(text.trim())) {
    const url = text.trim().match(urlRegex)?.[0]
    return `<a href="${url}" target="_blank" rel="noopener">${url}</a>`
  }

  return false
} 