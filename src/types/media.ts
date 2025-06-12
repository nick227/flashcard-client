export type MediaType = 'text' | 'image' | 'youtube' | 'link'

export interface MediaProps {
  type: MediaType
  url: string
  alt?: string
} 