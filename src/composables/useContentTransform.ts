import { useMediaUtils } from './useMediaUtils'
import { useCardMediaStyles } from './useCardMediaStyles'
import type { CardViewMode } from './useCardMediaStyles'

export function useContentTransform(viewMode: CardViewMode = 'full') {
  const { isYouTubeUrl, getYouTubeEmbedUrl } = useMediaUtils()
  const { mediaStyles, youtubeStyles } = useCardMediaStyles(viewMode)

  const transformContent = (text: string, imageUrl?: string | null): string => {
    const hasText = !!text && !isYouTubeUrl(text) && !isImageUrl(text) && !isWebUrl(text)
    const hasImage = !!imageUrl

    // If we have both text and image, create a combined layout
    if (hasText && hasImage) {
      const imageStyles = {
        ...mediaStyles.value,
        maxHeight: '33%' // Reduce image height when there's text
      }
      const styles = Object.entries(imageStyles)
        .map(([key, value]) => `${key}: ${value}`)
        .join(';')
      return `
        <div class="media-with-text">
          <img 
            src="${imageUrl}" 
            alt="${text}" 
            style="${styles}" 
            class="embedded-image" 
            onerror="this.onerror=null; this.src='/images/placeholder.png'; this.classList.add('error')"
            loading="lazy"
          />
          <div class="card-text">${text}</div>
        </div>
      `
    }

    // Handle imageUrl if present
    if (imageUrl) {
      const styles = Object.entries(mediaStyles.value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(';')
      return `
        <img 
          src="${imageUrl}" 
          alt="${text || 'Embedded image'}" 
          style="${styles}" 
          class="embedded-image" 
          onerror="this.onerror=null; this.src='/images/placeholder.png'; this.classList.add('error')"
          loading="lazy"
        />
      `
    }

    if (!text) return ''

    // If it's a YouTube URL, return the embed iframe
    if (isYouTubeUrl(text)) {
      const styles = Object.entries(youtubeStyles.value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(';')
      return `
        <div class="youtube-container" style="position: relative; width: 100%; height: 0; padding-bottom: 56.25%;">
          <iframe 
            src="${getYouTubeEmbedUrl(text)}" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen 
            style="${styles}" 
            class="youtube-iframe"
            loading="lazy"
          ></iframe>
        </div>
      `
    }

    // If it's an image URL, return an img tag
    if (isImageUrl(text)) {
      const styles = Object.entries(mediaStyles.value)
        .map(([key, value]) => `${key}: ${value}`)
        .join(';')
      return `
        <img 
          src="${text}" 
          alt="Embedded image" 
          style="${styles}" 
          class="embedded-image" 
          onerror="this.onerror=null; this.src='/images/placeholder.png'; this.classList.add('error')"
          loading="lazy"
        />
      `
    }

    // If it's a URL, return an anchor tag
    if (isWebUrl(text)) {
      return `
        <a 
          href="${text}" 
          target="_blank" 
          rel="noopener noreferrer" 
          class="embedded-link"
          onclick="event.stopPropagation()"
        >${text}</a>
      `
    }

    // Otherwise return the content as is
    return text
  }

  const isImageUrl = (url: string) => {
    return url?.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)
  }

  const isWebUrl = (url: string) => {
    return url?.match(/^https?:\/\//i)
  }

  return {
    transformContent,
    isImageUrl,
    isWebUrl
  }
} 