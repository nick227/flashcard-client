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

interface MediaReference {
    originalUrl: string
    embedId: string
    timestamp: number
}

interface MediaResult {
    type: MediaType
    url: string
    embedUrl?: string
    isValid: boolean
    error?: string
}

interface MediaUtils {
    // Core media operations
    processContent: (content: string, isEditing: boolean) => string
    removeEmbed: (content: string, elementOrEmbedId: HTMLElement | string) => string
    detectAndRenderMedia: (text: string, isEditing?: boolean) => string
    detectMediaType: (url: string) => MediaResult
    generateMediaHtml: (media: MediaResult, isEditing?: boolean) => string
    
    // Media type checks
    isYouTubeUrl: (url: string | null | undefined) => boolean
    isImageUrl: (url: string | null | undefined) => boolean
    isWebUrl: (url: string) => boolean
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

// URL Detection - Improved regex for better URL matching
const URL_REGEX = /(https?:\/\/[^\s<>"']+)/g

// Persistent media references across composable instances
const mediaReferences = new Map<string, MediaReference>()

const isValidYouTubeId = (id: string): boolean => {
    return /^[a-zA-Z0-9_-]{11}$/.test(id?.trim() || '')
}

const extractYouTubeId = (url: string): string | null => {
    const cleanedUrl = url.replace(/\s+/g, '').trim()
    if (!cleanedUrl) return null
    
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?.*&v=([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/
    ]
    
    for (const pattern of patterns) {
        const match = cleanedUrl.match(pattern)
        if (match?.[1] && isValidYouTubeId(match[1])) {
            return match[1]
        }
    }
    
    return null
}

// Media Type Detection
const detectUrlType = (url: string): MediaType => {
    
    const cleanedUrl = url.replace(/\s+/g, '').trim()
    if (!cleanedUrl) {
        return 'text'
    }
    
    try {
        const parsedUrl = new URL(cleanedUrl)
        
        // Check for YouTube first
        if (cleanedUrl.includes('youtube.com') || cleanedUrl.includes('youtu.be')) {
            const videoId = extractYouTubeId(cleanedUrl)
            return videoId ? 'youtube' : 'link'
        }
        
        // Check for image file extensions
        const hasImageExtension = MEDIA_CONFIG.image.allowedExtensions.some(ext => 
            parsedUrl.pathname.toLowerCase().endsWith(ext)
        )
        
        // Check for common image hosting domains
        const isImageHost = [
            'images.unsplash.com',
            'cdn.pixabay.com',
            'images.pexels.com',
            'imgur.com',
            'i.imgur.com',
            'flickr.com',
            'staticflickr.com'
        ].some(domain => parsedUrl.hostname.toLowerCase().includes(domain))
        
        // Check for image-related query parameters
        const hasImageParams = [
            'image',
            'photo',
            'img',
            'picture',
            'media'
        ].some(param => 
            parsedUrl.pathname.toLowerCase().includes(param) || 
            parsedUrl.searchParams.toString().toLowerCase().includes(param)
        )
        
        if (hasImageExtension || isImageHost || hasImageParams) {
            return 'image'
        }
        
        // Check for other video platforms
        if (cleanedUrl.includes('vimeo.com') || cleanedUrl.includes('dailymotion.com')) {
            return 'link'
        }
        
        return 'text'
    } catch (error) {
        return 'text'
    }
}

export function useMediaUtils(): MediaUtils {
    // State - removed local mediaReferences, using global one above

    // Utilities
    const generateEmbedId = (): string => 
        `embed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const cleanUrl = (url: string): string => {
        if (url.includes('<div') || url.includes('<img')) {
            return url
        }
        return url?.replace(/\s+/g, '').trim() || ''
    }

    const detectMediaType = (url: string): MediaResult => {
        if (!url?.trim()) {
            return { type: 'text', url: '', isValid: false, error: 'Empty URL' }
        }

        const cleanedUrl = cleanUrl(url)
        const type = detectUrlType(cleanedUrl)
        
        if (type === 'youtube') {
            const videoId = extractYouTubeId(cleanedUrl)
            if (videoId) {
                const embedUrl = `https://www.youtube.com/embed/${videoId}?${MEDIA_CONFIG.youtube.embedParams}`
                return {
                    type: 'youtube',
                    url: cleanedUrl,
                    embedUrl,
                    isValid: true
                }
            }
        }

        return { type, url: cleanedUrl, isValid: true }
    }

    const generateMediaHtml = (media: MediaResult, isEditing: boolean = false): string => {
        if (!media.isValid) {
            return media.url || ''
        }

        const embedId = generateEmbedId()
        mediaReferences.set(embedId, {
            originalUrl: media.url,
            embedId,
            timestamp: Date.now()
        })

        const closeButton = isEditing ? `<button class="media-close" data-media-type="${media.type}" data-media-url="${media.url}" data-embed-id="${embedId}"><i class="fas fa-times"></i></button>` : ''

        if (media.type === 'youtube') {
            return `<div class="media-container youtube-embed" data-embed-id="${embedId}">
                <iframe 
                    width="100%" 
                    height="100%" 
                    src="${media.embedUrl}" 
                    frameborder="0" 
                    allow="fullscreen" 
                    loading="lazy"
                    referrerpolicy="no-referrer"
                    title="YouTube video player"
                    importance="high"
                ></iframe>
                ${closeButton}
            </div>`
        }
        
        if (media.type === 'image') {
            return `<div class="media-container" data-embed-id="${embedId}">
                <img 
                    src="${media.url}" 
                    alt="Card image" 
                    class="auto-image" 
                    loading="lazy" 
                    onerror="this.onerror=null; this.src='/images/placeholder.png'; this.classList.add('error')"
                    referrerpolicy="no-referrer"
                />
                ${closeButton}
            </div>`
        }
        
        if (media.type === 'link') {
            return `<a 
                href="${media.url}" 
                target="_blank" 
                rel="noopener noreferrer" 
                class="embedded-link"
                data-embed-id="${embedId}"
                onclick="event.stopPropagation()"
            >${media.url}</a>`
        }
        
        return media.url || ''
    }

    const processContent = (content: string, isEditing: boolean): string => {
        if (content.includes('<div') || content.includes('<img')) {
            return content.replace(/(<[^>]+>)/g, (match) => match.replace(/\s+/g, ' '))
        }
        
        const trimmedContent = cleanUrl(content)
        if (!trimmedContent) {
            return ''
        }
        
        if (trimmedContent.startsWith('http')) {
            const media = detectMediaType(trimmedContent)
            if (media.type === 'youtube' || media.type === 'image') {
                return generateMediaHtml(media, isEditing)
            }
            
            if (!isEditing) {
                return generateMediaHtml(media, isEditing)
            }
        }
        
        return trimmedContent
    }
    
    const removeEmbed = (content: string, elementOrEmbedId: HTMLElement | string): string => {
        const embedId = typeof elementOrEmbedId === 'string' 
            ? elementOrEmbedId 
            : elementOrEmbedId.getAttribute('data-embed-id') || undefined
            
        if (!embedId) {
            return content
        }
        
        const reference = mediaReferences.get(embedId)
        
        if (!reference) {
            return content
        }
        
        mediaReferences.delete(embedId)
        
        // Instead of removing all occurrences of the URL, we need to be more precise
        // Look for the specific embed HTML that contains this embedId
        const embedRegex = new RegExp(`<div[^>]*data-embed-id="${embedId}"[^>]*>.*?</div>`, 'gs')
        let result = content.replace(embedRegex, '')
        
        // If no embed HTML found, try removing just the URL (fallback)
        if (result === content) {
            result = content.replace(reference.originalUrl, '').trim()
        }
        
        return result
    }
    
    const detectAndRenderMedia = (text: string, isEditing: boolean = false): string => {
        
        if (!text?.trim()) {
            return ''
        }

        const cleanedText = text.replace(/\s+/g, ' ').trim()
        
        let lastIndex = 0
        let result = ''
        let match

        while ((match = URL_REGEX.exec(cleanedText)) !== null) {
            
            result += cleanedText.slice(lastIndex, match.index)
            
            const url = match[1].trim()
            
            const media = detectMediaType(url)
            
            if (media.type === 'youtube' || media.type === 'image') {
                const html = generateMediaHtml(media, isEditing)
                result += html
            } else {
                result += `<a href="${url}" target="_blank" rel="noopener noreferrer" class="embedded-link" onclick="event.stopPropagation()">${url}</a>`
            }
            
            lastIndex = match.index + match[0].length
        }
        
        result += cleanedText.slice(lastIndex)
        return result
    }

    return {
        processContent,
        removeEmbed,
        detectAndRenderMedia,
        detectMediaType,
        generateMediaHtml,
        isYouTubeUrl: (url: string | null | undefined) => url?.trim() ? detectUrlType(url) === 'youtube' : false,
        isImageUrl: (url: string | null | undefined) => {
            if (!url?.trim()) return false
            
            // Check for blob URLs (local file previews)
            if (url.startsWith('blob:')) {
                return true
            }
            
            // Check for data URLs (base64 encoded images)
            if (url.startsWith('data:image/')) {
                return true
            }
            
            // Check for regular image URLs
            return detectUrlType(url) === 'image'
        },
        isWebUrl: (url: string) => {
            if (!url?.trim()) return false
            try {
                const parsedUrl = new URL(url.trim())
                return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
            } catch {
                return false
            }
        }
    }
} 