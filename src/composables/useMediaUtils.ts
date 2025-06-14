export type MediaType = 'text' | 'image' | 'youtube' | 'link'

interface ContentBlock {
  type: MediaType
  content: string
  url?: string
}

export function useMediaUtils() {
  const isYouTubeUrl = (url: string | null | undefined): boolean => {
    if (!url || typeof url !== 'string') return false
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

  const parseContentBlocks = (html: string): ContentBlock[] => {
    const blocks: ContentBlock[] = []
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html

    // Process each node
    const processNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim()
        if (text) {
          blocks.push({ type: 'text', content: text })
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement
        if (element.tagName === 'IMG') {
          const src = element.getAttribute('src')
          if (src) {
            blocks.push({ type: 'image', content: src, url: src })
          }
        } else if (element.tagName === 'IFRAME') {
          const src = element.getAttribute('src')
          if (src) {
            blocks.push({ type: 'youtube', content: src, url: src })
          }
        } else if (element.tagName === 'A') {
          const href = element.getAttribute('href')
          if (href) {
            blocks.push({ type: 'link', content: element.textContent || '', url: href })
          }
        } else {
          // Process child nodes
          Array.from(element.childNodes).forEach(processNode)
        }
      }
    }

    Array.from(tempDiv.childNodes).forEach(processNode)
    return blocks
  }

  const renderContentBlocks = (blocks: ContentBlock[]): string => {
    return blocks.map(block => {
      switch (block.type) {
        case 'image':
          return `<img src="${block.content}" alt="Card image" class="auto-image" />`
        case 'youtube':
          return `<div class="youtube-embed"><iframe src="${getYouTubeEmbedUrl(block.content)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
        case 'link':
          return `<a href="${block.url}" target="_blank" rel="noopener noreferrer">${block.content}</a>`
        default:
          return block.content
      }
    }).join('')
  }

  const detectAndRenderMedia = (text: string): string => {
    if (!text) return ''
    
    // First, try to parse as HTML to handle mixed content
    try {
      const blocks = parseContentBlocks(text)
      if (blocks.length > 0) {
        return renderContentBlocks(blocks)
      }
    } catch (e) {
      // If parsing fails, fall back to simple URL detection
    }
    
    // Fallback to simple URL detection
    if (isYouTubeUrl(text)) {
      const embedUrl = getYouTubeEmbedUrl(text)
      return `<div class="youtube-embed"><iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`
    }
    
    if (isImageUrl(text)) {
      return `<img src="${text}" alt="Card image" class="auto-image" />`
    }
    
    if (isWebUrl(text)) {
      return `<a href="${text}" target="_blank" rel="noopener noreferrer">${text}</a>`
    }
    
    return text
  }

  return {
    isYouTubeUrl,
    getYouTubeEmbedUrl,
    isImageUrl,
    isWebUrl,
    getMediaType,
    detectAndRenderMedia,
    parseContentBlocks,
    renderContentBlocks
  }
} 