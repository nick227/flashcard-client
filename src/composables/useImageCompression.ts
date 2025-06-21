import { ref } from 'vue'
import { createCanvasBlob } from '../utils/canvas'

/**
 * Options for customizing the image compression process.
 */
export interface CompressionOptions {
  /** Maximum width of the compressed image. */
  maxWidth?: number
  /** Maximum height of the compressed image. */
  maxHeight?: number
  /** The desired quality of the output image, from 0.1 to 1.0. */
  quality?: number
  /** The output format for the compressed image. */
  format?: 'jpeg' | 'webp'
  /** Whether to preserve the original aspect ratio. */
  preserveAspectRatio?: boolean
  /** Whether to enable content-aware adjustments for quality and format. */
  contentAware?: boolean
}

/**
 * The result of a successful compression operation.
 */
export interface CompressionResult {
  /** The compressed image file. */
  file: File
  /** The original size of the image in bytes. */
  originalSize: number
  /** The final size of the compressed image in bytes. */
  compressedSize: number
  /** The percentage reduction in file size. */
  compressionRatio: number
  /** The dimensions of the compressed image. */
  dimensions: { width: number; height: number }
  /** The format of the compressed image. */
  format: string
  /** The quality setting used for the compression. */
  quality: number
}

/**
 * Options for the smart compression feature, which aims for a target file size.
 */
export interface SmartCompressionOptions {
  /** The target file size in bytes. */
  targetSize?: number
  /** The maximum quality to use (0.1 to 1.0). */
  maxQuality?: number
  /** The minimum quality to use (0.1 to 1.0). */
  minQuality?: number
  /** Whether to allow conversion to WebP format if beneficial. */
  enableWebP?: boolean
  /** Whether to enable content-aware analysis. */
  contentAware?: boolean
}

// Constants for configuration
const MAX_FILE_SIZE_MB = 50
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
const DEFAULT_QUALITY = 0.8
const MIN_QUALITY = 0.1
const MAX_QUALITY = 1.0

// Sizing tiers for smart compression based on file size in MB
const SIZING_TIERS = [
  { maxSize: 1, maxWidth: 1600, maxHeight: 1200, quality: 0.9 },
  { maxSize: 2, maxWidth: 1400, maxHeight: 1050, quality: 0.85 },
  { maxSize: 5, maxWidth: 1200, maxHeight: 900, quality: 0.8 },
  { maxSize: 10, maxWidth: 1000, maxHeight: 750, quality: 0.7 },
  { maxSize: 15, maxWidth: 800, maxHeight: 600, quality: 0.6 },
  { maxSize: Infinity, maxWidth: 600, maxHeight: 450, quality: 0.5 }
]

// Helper function to calculate new dimensions
function calculateNewDimensions(
  img: { width: number; height: number }, 
  maxWidth: number, 
  maxHeight: number,
  preserveAspectRatio: boolean
) {
  let { width, height } = img

  if (width > maxWidth || height > maxHeight) {
    if (preserveAspectRatio) {
      const ratio = Math.min(maxWidth / width, maxHeight / height)
      width = Math.round(width * ratio)
      height = Math.round(height * ratio)
    } else {
      width = maxWidth
      height = maxHeight
    }
  }
  return { width, height }
}

export function useImageCompression() {
  const isCompressing = ref(false)
  const compressionProgress = ref(0)
  const canUseOffscreenCanvas = typeof OffscreenCanvas !== 'undefined'

  // Memoize WebP support check
  const supportsWebP = (() => {
    let supported: boolean | null = null
    return () => {
      if (supported === null) {
        const canvas = document.createElement('canvas')
        canvas.width = 1
        canvas.height = 1
        supported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
      }
      return supported
    }
  })()

  // Analyze image content for smart compression
  const analyzeImageContent = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): {
    hasTransparency: boolean
    isPhotographic: boolean
    complexity: number
  } => {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data
    let transparentPixels = 0
    let totalPixels = 0
    const colorMap = new Set<number>() // Use numbers for keys
    const maxColors = 1000 // Limit color tracking to prevent memory issues

    // Sample pixels for analysis (every 20th pixel for better performance)
    for (let i = 0; i < data.length; i += 80) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      const a = data[i + 3]

      totalPixels++

      // Check transparency
      if (a < 255) {
        transparentPixels++
      }

      // Count unique colors using a bitwise key
      if (colorMap.size < maxColors) {
        // Combine R, G, and B into a single 24-bit integer
        const colorKey = (r << 16) | (g << 8) | b
        colorMap.add(colorKey)
      }
    }

    const transparencyRatio = totalPixels > 0 ? transparentPixels / totalPixels : 0
    const colorVariety = totalPixels > 0 ? Math.min(colorMap.size / totalPixels, 1) : 0

    return {
      hasTransparency: transparencyRatio > 0.01,
      isPhotographic: colorVariety > 0.3,
      complexity: colorVariety
    }
  }

  // Get smart compression options based on file size and content
  const getSmartCompressionOptions = (
    file: File, 
    options: SmartCompressionOptions = {}
  ): CompressionOptions => {
    const {
      targetSize,
      maxQuality = MAX_QUALITY,
      minQuality = MIN_QUALITY,
      enableWebP = true,
      contentAware = true
    } = options

    const sizeMB = file.size / (1024 * 1024)
    const supportsWebPFormat = enableWebP && supportsWebP()
    
    // Find the appropriate sizing tier
    const tier = SIZING_TIERS.find(t => sizeMB <= t.maxSize) || SIZING_TIERS[SIZING_TIERS.length - 1]
    
    let baseOptions: CompressionOptions = {
      ...tier,
      preserveAspectRatio: true,
      contentAware
    }

    // Performance optimization: limit maximum dimensions for very large images
    if (sizeMB > 25) {
      baseOptions.maxWidth = Math.min(baseOptions.maxWidth || 1600, 400)
      baseOptions.maxHeight = Math.min(baseOptions.maxHeight || 1200, 300)
      baseOptions.quality = Math.min(baseOptions.quality || 0.9, 0.4)
    }

    // Format selection based on content and size
    if (supportsWebPFormat && (sizeMB > 0.5 || file.type === 'image/png')) {
      baseOptions.format = 'webp'
    } else {
      baseOptions.format = 'jpeg'
    }

    // Adjust quality based on target size if specified
    if (targetSize && targetSize < file.size) {
      const compressionRatio = targetSize / file.size
      const adjustedQuality = Math.max(minQuality, Math.min(maxQuality, compressionRatio * 1.2))
      baseOptions.quality = adjustedQuality
    }

    return baseOptions
  }

  // Internal helper to perform the actual compression from a bitmap
  async function compressBitmap(
    imageBitmap: ImageBitmap,
    originalFile: File,
    options: CompressionOptions
  ): Promise<CompressionResult> {
    const {
      maxWidth = 800,
      maxHeight = 600,
      quality = DEFAULT_QUALITY,
      format = 'jpeg',
      preserveAspectRatio = true,
      contentAware = true
    } = options

    const validatedQuality = Math.max(MIN_QUALITY, Math.min(MAX_QUALITY, quality))

    const { width, height } = calculateNewDimensions(imageBitmap, maxWidth, maxHeight, preserveAspectRatio)
    if (width <= 0 || height <= 0) throw new Error('Invalid calculated dimensions')

    let finalQuality = validatedQuality
    let finalFormat = format

    if (contentAware) {
      const analysisCanvas = document.createElement('canvas')
      analysisCanvas.width = width
      analysisCanvas.height = height
      const analysisCtx = analysisCanvas.getContext('2d')
      if (!analysisCtx) throw new Error('Could not get analysis canvas context')
      
      analysisCtx.drawImage(imageBitmap, 0, 0, width, height)
      const analysis = analyzeImageContent(analysisCanvas, analysisCtx)
      
      if (analysis.hasTransparency && format === 'jpeg') finalFormat = 'webp'
      if (analysis.isPhotographic) finalQuality = Math.max(0.6, validatedQuality)
      else finalQuality = Math.min(MAX_QUALITY, validatedQuality + 0.1)
    }

    const canvas = canUseOffscreenCanvas ? new OffscreenCanvas(width, height) : document.createElement('canvas')
    if (!canUseOffscreenCanvas) {
      (canvas as HTMLCanvasElement).width = width;
      (canvas as HTMLCanvasElement).height = height;
    }

    const ctx = canvas.getContext('2d')
    if (!ctx || !('drawImage' in ctx)) throw new Error('Canvas 2D context not supported')

    ctx.drawImage(imageBitmap, 0, 0, width, height)
    
    const mimeType = finalFormat === 'webp' ? 'image/webp' : 'image/jpeg'
    const blob = await createCanvasBlob(canvas, mimeType, finalQuality)
    
    const originalName = originalFile.name.replace(/\.[^/.]+$/, '')
    const newFileName = `${originalName}.${finalFormat === 'webp' ? 'webp' : 'jpg'}`
    const compressedFile = new File([blob], newFileName, { type: mimeType })

    return {
      file: compressedFile,
      originalSize: originalFile.size,
      compressedSize: compressedFile.size,
      compressionRatio: (1 - compressedFile.size / originalFile.size) * 100,
      dimensions: { width, height },
      format: finalFormat,
      quality: finalQuality
    }
  }

  // Progressive compression with binary search to meet target size
  const progressiveCompress = async (
    file: File,
    targetSize: number,
    maxAttempts: number = 7
  ): Promise<CompressionResult> => {
    let lowerBoundQuality = MIN_QUALITY
    let upperBoundQuality = MAX_QUALITY
    let bestResult: CompressionResult | null = null

    const options = getSmartCompressionOptions(file, { targetSize })
    const imageBitmap = await createImageBitmap(file)

    try {
      for (let i = 0; i < maxAttempts; i++) {
        const currentQuality = (lowerBoundQuality + upperBoundQuality) / 2
        options.quality = currentQuality

        try {
          const result = await compressBitmap(imageBitmap, file, options)

          if (result.compressedSize <= targetSize) {
            bestResult = result
            lowerBoundQuality = currentQuality
          } else {
            upperBoundQuality = currentQuality
          }

          if (Math.abs(result.compressedSize - targetSize) < targetSize * 0.05 && bestResult) {
            break
          }
        } catch (error) {
          console.warn(`Progressive compression attempt failed at quality ${currentQuality}:`, error)
          upperBoundQuality = currentQuality * 0.9
        }
        
        if (upperBoundQuality - lowerBoundQuality < 0.01) {
          break
        }
      }

      if (!bestResult) {
        options.quality = MIN_QUALITY
        bestResult = await compressBitmap(imageBitmap, file, options)
      }
      
      return bestResult
    } finally {
      imageBitmap.close() // Ensure bitmap memory is released
    }
  }

  // Get optimal compression options based on file size (legacy method)
  const getCompressionOptions = (file: File): CompressionOptions => {
    // Always returns smart options. The function is kept for legacy API compatibility.
    return getSmartCompressionOptions(file)
  }

  // Compress image using canvas with smart features
  const compressImage = async (
    file: File, 
    options: CompressionOptions = {}
  ): Promise<CompressionResult> => {
    isCompressing.value = true
    compressionProgress.value = 10

    let imageBitmap: ImageBitmap | null = null
    let success = false
    try {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        throw new Error(`File too large (${formatFileSize(file.size)}). Maximum size is ${formatFileSize(MAX_FILE_SIZE_BYTES)}`)
      }

      const compressionOptions = Object.keys(options).length > 0 ? options : getSmartCompressionOptions(file)
      
      compressionProgress.value = 20
      imageBitmap = await createImageBitmap(file)
      
      // Pass the original file's type to the compression logic
      const result = await compressBitmap(imageBitmap, file, compressionOptions)

      // Safety check: only return compressed file if it's smaller
      if (result.file.size >= file.size) {
        console.warn(`Compression did not reduce file size. Returning original file.`)
        success = true
        // The original imageBitmap is used here to provide dimensions
        return {
          file: file,
          originalSize: file.size,
          compressedSize: file.size,
          compressionRatio: 0,
          dimensions: { width: imageBitmap.width, height: imageBitmap.height },
          format: file.type.replace('image/', ''),
          quality: 1.0
        }
      }

      success = true
      return result
    } catch (error) {
      console.error('Image compression failed:', error)
      throw error
    } finally {
      if (imageBitmap) {
        imageBitmap.close()
      }
      if (success) {
        compressionProgress.value = 100
      }
      isCompressing.value = false
      // Reset progress to 0 for the next run, but only after a short delay 
      // to allow the progress bar to show 100%
      setTimeout(() => {
        compressionProgress.value = 0
      }, 500)
    }
  }

  // Smart compress with target size
  const smartCompress = async (
    file: File,
    options: SmartCompressionOptions = {}
  ): Promise<CompressionResult> => {
    const { targetSize } = options
    
    if (targetSize && targetSize < file.size) {
      return await progressiveCompress(file, targetSize)
    }
    
    return await compressImage(file, getSmartCompressionOptions(file, options))
  }

  // Convert image to WebP format
  const convertToWebP = async (file: File, quality: number = 0.8): Promise<File> => {
    if (!supportsWebP()) {
      return file
    }

    const result = await compressImage(file, {
      maxWidth: 1600,
      maxHeight: 1200,
      quality,
      format: 'webp'
    })

    return result.file
  }

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return {
    isCompressing,
    compressionProgress,
    supportsWebP,
    getCompressionOptions,
    getSmartCompressionOptions,
    compressImage,
    smartCompress,
    progressiveCompress,
    convertToWebP,
    formatFileSize
  }
} 