export type MediaType = 'text' | 'image' | 'youtube' | 'link'

interface MediaConfig {
    youtube: {
        embedParams: string
        allowedDomains: string[]
    }
    image: {
        allowedExtensions: string[]
    }
}

interface MediaResult {
    type: MediaType
    url: string
    embedUrl?: string
    isValid: boolean
    error?: string
}

// Configuration
const MEDIA_CONFIG: MediaConfig = {
    youtube: {
        embedParams: 'rel=0&modestbranding=1&autoplay=0',
        allowedDomains: ['youtube.com', 'youtu.be', 'www.youtube.com']
    },
    image: {
        allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    }
}

// Pure utility functions
const parseUrl = (url: string): URL | null => {
    if (!url?.trim()) return null
    try {
        return new URL(url.trim())
    } catch {
        return null
    }
}

const isValidYouTubeId = (id: string): boolean => 
    /^[\w-]{11}$/.test(id?.trim() || '')

const extractYouTubeId = (url: string): string | null => {
    if (!url?.trim()) return null
    const match = url.trim().match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})(?:\S*)?/)
    return match && isValidYouTubeId(match[1]) ? match[1] : null
}

const isDomainAllowed = (hostname: string, allowedDomains: string[]): boolean =>
    Boolean(hostname) && allowedDomains.some(domain => hostname.toLowerCase().includes(domain.toLowerCase()))

const hasAllowedExtension = (pathname: string, allowedExtensions: string[]): boolean => {
    if (!pathname) return false
    // Remove query parameters and hash before checking extension
    const cleanPath = pathname.split('?')[0].split('#')[0].toLowerCase()
    return allowedExtensions.some(ext => cleanPath.endsWith(ext.toLowerCase()))
}

// Improved URL regex that better handles complete URLs and edge cases
const URL_REGEX = /(?:^|\s)(https?:\/\/[^\s<>"']+)(?:\s|$)/g

export function useMediaUtils() {
    // URL Type Detection
    const detectUrlType = (url: string): MediaType => {
        if (!url?.trim()) return 'text'
        
        const parsedUrl = parseUrl(url)
        if (!parsedUrl) return 'text'

        const hostname = parsedUrl.hostname.toLowerCase()
        
        if (isDomainAllowed(hostname, MEDIA_CONFIG.youtube.allowedDomains)) {
            return 'youtube'
        }
        
        if (hasAllowedExtension(parsedUrl.pathname, MEDIA_CONFIG.image.allowedExtensions)) {
            return 'image'
        }
        
        return 'link'
    }

    // Media Detection
    const detectMediaType = (url: string): MediaResult => {
        if (!url?.trim()) {
            return { type: 'text', url: '', isValid: false, error: 'Empty URL' }
        }

        const type = detectUrlType(url)
        
        if (type === 'youtube') {
            const videoId = extractYouTubeId(url)
            if (videoId) {
                return {
                    type: 'youtube',
                    url,
                    embedUrl: `https://www.youtube.com/embed/${videoId}?${MEDIA_CONFIG.youtube.embedParams}`,
                    isValid: true
                }
            }
        }

        return { type, url: url.trim(), isValid: true }
    }

    // HTML Generation
    const generateMediaHtml = (media: MediaResult, onClose?: (event: Event) => void): string => {
        if (!media.isValid) return media.url || ''

        const htmlGenerators = {
            youtube: () => `<div class="youtube-embed"><iframe src="${media.embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`,
            image: () => `<div class="media-container">
                <img src="${media.url}" alt="Card image" class="auto-image" loading="lazy" onerror="this.onerror=null; this.src='/images/placeholder.png'; this.classList.add('error')" />
                ${onClose ? `<button class="media-close" onclick="this.dispatchEvent(new CustomEvent('media-close', {bubbles:true}))">×</button>` : ''}
            </div>`,
            link: () => `<a href="${media.url}" target="_blank" rel="noopener noreferrer" class="embedded-link" onclick="event.stopPropagation()">${media.url}</a>`,
            text: () => media.url || ''
        }

        return htmlGenerators[media.type]()
    }

    // Main Processing
    const detectAndRenderMedia = (text: string, onClose?: (event: Event) => void): string => {
        if (!text?.trim()) return ''

        let lastIndex = 0
        let result = ''
        let match

        while ((match = URL_REGEX.exec(text)) !== null) {
            // Add text before the URL
            result += text.slice(lastIndex, match.index)
            
            // Process the complete URL
            const url = match[1].trim()
            const media = detectMediaType(url)
            result += generateMediaHtml(media, onClose)
            
            lastIndex = match.index + match[0].length
        }
        
        // Add remaining text
        result += text.slice(lastIndex)
        
        return result
    }

    // Content Transformation
    const transformContent = (text: string, imageUrl?: string | null, onClose?: (event: Event) => void): string => {
        // If both text and image are empty, return empty string
        if (!text?.trim() && !imageUrl?.trim()) return ''

        // If we have an image but no text, just return the image container
        if (imageUrl?.trim() && !text?.trim()) {
            return `<div class="media-container">
                <img 
                    src="${imageUrl.trim()}" 
                    alt="Card image" 
                    class="embedded-image" 
                    onerror="this.onerror=null; this.src='/images/placeholder.png'; this.classList.add('error')"
                    loading="lazy"
                />
                ${onClose ? `<button class="media-close" onclick="this.dispatchEvent(new CustomEvent('media-close', {bubbles:true}))">×</button>` : ''}
            </div>`
        }

        // If we have text but no image, just return the text
        if (text?.trim() && !imageUrl?.trim()) {
            return text.trim()
        }

        // If we have both text and image, create a combined layout
        if (text?.trim() && imageUrl?.trim()) {
            return `
                <div class="media-with-text">
                    <div class="media-container">
                        <img 
                            src="${imageUrl.trim()}" 
                            alt="${text.trim()}" 
                            class="embedded-image" 
                            onerror="this.onerror=null; this.src='/images/placeholder.png'; this.classList.add('error')"
                            loading="lazy"
                        />
                        ${onClose ? `<button class="media-close" onclick="this.dispatchEvent(new CustomEvent('media-close', {bubbles:true}))">×</button>` : ''}
                    </div>
                    <div class="card-text">${text.trim()}</div>
                </div>
            `
        }

        // Process text content for media URLs if no image is present
        if (text?.trim()) {
            // Check for media URLs in the text
            const media = detectMediaType(text)
            if (media.type !== 'text') {
                return generateMediaHtml(media, onClose)
            }

            // If it's a web URL, return an anchor tag
            if (isWebUrl(text)) {
                return `
                    <a 
                        href="${text.trim()}" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        class="embedded-link"
                        onclick="event.stopPropagation()"
                    >${text.trim()}</a>
                `
            }

            // Otherwise return the content as is
            return text.trim()
        }

        return ''
    }

    // Improved URL validation
    const isWebUrl = (url: string): boolean => {
        if (!url?.trim()) return false
        try {
            const parsedUrl = new URL(url.trim())
            return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
        } catch {
            return false
        }
    }

    return {
        isValidYouTubeId,
        transformContent,
        detectAndRenderMedia,
        detectMediaType,
        isYouTubeUrl: (url: string | null | undefined) => url?.trim() ? detectUrlType(url) === 'youtube' : false,
        isImageUrl: (url: string | null | undefined) => url?.trim() ? detectUrlType(url) === 'image' : false,
        isWebUrl
    }
} 