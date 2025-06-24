import type { ContentCell, CardLayout } from '@/types/card'

// Layout constants
const LAYOUT_CELL_COUNTS = {
  'default': 1,
  'two-col': 2,
  'two-row': 2
} as const

/**
 * Creates a text cell with the given content
 */
export function createTextCell(content: string = ''): ContentCell {
  return {
    type: 'text',
    content: content.trim(),
    mediaUrl: null
  }
}

/**
 * Creates a media cell with the given URL
 */
export function createMediaCell(mediaUrl: string): ContentCell {
  return {
    type: 'media',
    content: '',
    mediaUrl
  }
}

/**
 * Creates an empty text cell
 */
export function createEmptyCell(): ContentCell {
  return createTextCell('')
}

/**
 * Intelligently determines the best layout based on content
 */
export function determineOptimalLayout(
  text?: string, 
  imageUrl?: string | null, 
  currentLayout?: CardLayout
): CardLayout {
  const hasText = text && text.trim().length > 0
  const hasImage = imageUrl && imageUrl.trim().length > 0
  
  // If user explicitly set a layout, respect it
  if (currentLayout) {
    return currentLayout
  }
  
  // Auto-determine based on content only when no layout is specified
  if (hasText && hasImage) {
    return 'two-row'  // Best for text + image combination
  } else if (hasText) {
    return 'default'  // Text only works well in default
  } else if (hasImage) {
    return 'default'  // Image only works well in default
  } else {
    return 'default'  // Empty content defaults to default
  }
}

/**
 * Creates cells from text and image URL, handling layout-specific logic
 */
export function createCellsFromContent(
  text?: string, 
  imageUrl?: string | null, 
  layout?: CardLayout
): ContentCell[] {
  const cells: ContentCell[] = []
  
  // Determine optimal layout based on content
  const effectiveLayout = determineOptimalLayout(text, imageUrl, layout)
  
  // Handle layout-specific logic
  if (effectiveLayout === 'two-col' && text) {
    const lines = text.split('\n').filter(line => line.trim())
    
    // Check if the first line is an image URL
    if (lines.length > 0 && lines[0].startsWith('http')) {
      // First cell is image
      cells.push(createMediaCell(lines[0].trim()))
      
      // Remaining lines are text
      if (lines.length > 1) {
        const remainingText = lines.slice(1).join('\n').trim()
        if (remainingText) {
          cells.push(createTextCell(remainingText))
        }
      }
    } else {
      // No image URL in text, treat as text only
      cells.push(createTextCell(text))
    }
  } else if (effectiveLayout === 'two-row') {
    // For two-row layout, add text first, then image
    if (text && text.trim()) {
      cells.push(createTextCell(text))
    }
    if (imageUrl) {
      cells.push(createMediaCell(imageUrl))
    }
  } else {
    // Default handling for other layouts
    if (text && text.trim()) {
      cells.push(createTextCell(text))
    }
  }
  
  // Add media from separate imageUrl field if it exists and we don't already have it
  if (imageUrl && !cells.some(cell => cell.type === 'media')) {
    if (effectiveLayout === 'two-col') {
      cells.unshift(createMediaCell(imageUrl))
    } else {
      cells.push(createMediaCell(imageUrl))
    }
  }
  
  // Ensure at least one cell exists
  if (cells.length === 0) {
    cells.push(createEmptyCell())
  }
  
  return cells
}

/**
 * Creates cells from a side object (for backend data transformation)
 */
export function createCellsFromSide(side: { 
  text?: string; 
  imageUrl?: string; 
  layout?: string 
}): ContentCell[] {
  return createCellsFromContent(side.text, side.imageUrl, side.layout as CardLayout)
}

/**
 * Processes cells back to text and image URL format (for form submission)
 */
export function processCellsToLegacyFormat(
  cells: ContentCell[]
): {
  text: string
  imageUrl: string | null
  imageFile: File | null
} {
  if (!Array.isArray(cells)) {
    return { text: '', imageUrl: null, imageFile: null }
  }
  
  const textCells: string[] = []
  let imageUrl: string | null = null
  let imageFile: File | null = null

  cells.forEach((cell) => {
    if (cell.type === 'media' && cell.mediaUrl) {
      // Check if this is a blob URL (local file) or external URL
      if (cell.mediaUrl.startsWith('blob:')) {
        // Local file - will be handled by pending files in the calling context
        // We can't access pendingImageFiles here, so we'll return null
        // and let the caller handle it
        imageFile = null
      } else {
        // External URL (already uploaded)
        imageUrl = cell.mediaUrl
      }
    } else if (cell.type === 'text' && cell.content) {
      // Check if the text content is actually an image URL
      if (cell.content.startsWith('http') && (
        cell.content.includes('.jpg') || 
        cell.content.includes('.png') || 
        cell.content.includes('.gif') || 
        cell.content.includes('youtube.com') || 
        cell.content.includes('youtu.be')
      )) {
        if (!imageUrl) {
          imageUrl = cell.content
        }
      } else {
        textCells.push(cell.content)
      }
    }
  })

  return {
    text: textCells.join('\n'),
    imageUrl,
    imageFile
  }
}

/**
 * Normalizes cells to match expected count for a layout
 */
export function normalizeCellsForLayout(
  cells: ContentCell[], 
  layout: CardLayout
): ContentCell[] {
  const expectedCount = LAYOUT_CELL_COUNTS[layout]
  
  if (cells.length === expectedCount) {
    return cells
  }
  
  if (cells.length > expectedCount) {
    // When reducing cells, preserve media cells and merge text cells intelligently
    const mediaCells = cells.filter(cell => cell.type === 'media')
    const textCells = cells.filter(cell => cell.type === 'text')
    
    if (layout === 'default') {
      // For default layout (1 cell), prioritize content intelligently
      // If we have both text and media, prefer text for default layout
      // as it's more readable in a single cell
      if (textCells.length > 0) {
        const mergedText = textCells.map(cell => cell.content).join('\n').trim()
        const result = [createTextCell(mergedText)]
        return result
      } else if (mediaCells.length > 0) {
        const result = [mediaCells[0]]
        return result
      } else {
        const result = [createEmptyCell()]
        return result
      }
    } else {
      // For two-col/two-row layouts (2 cells), try to preserve media + text structure
      if (mediaCells.length > 0 && textCells.length > 0) {
        // For two-row, put text first, then media
        if (layout === 'two-row') {
          const result = [textCells[0], mediaCells[0]]
          return result
        } else {
          // For two-col, put media first, then text
          const result = [mediaCells[0], textCells[0]]
          return result
        }
      } else if (mediaCells.length > 0) {
        const result = [mediaCells[0], createEmptyCell()]
        return result
      } else if (textCells.length > 0) {
        const mergedText = textCells.map(cell => cell.content).join('\n').trim()
        const result = [createTextCell(mergedText), createEmptyCell()]
        return result
      } else {
        const result = [createEmptyCell(), createEmptyCell()]
        return result
      }
    }
  } else {
    // Add empty cells when we need more
    const result = [
      ...cells,
      ...Array(expectedCount - cells.length).fill(null).map(() => createEmptyCell())
    ]
    return result
  }
}

/**
 * Validates that a cell has valid content
 */
export function validateCell(cell: ContentCell): boolean {
  if (cell.type !== 'text' && cell.type !== 'media') {
    return false
  }
  if (cell.type === 'media' && !cell.mediaUrl) {
    return false
  }
  return true
}

/**
 * Checks if a cell has content (text or media)
 */
export function cellHasContent(cell: ContentCell): boolean {
  if (cell.type === 'text') {
    return !!(cell.content && cell.content.trim().length > 0)
  }
  return cell.type === 'media' && !!cell.mediaUrl
}

/**
 * Validates that cells are appropriate for the given layout
 */
export function validateCellsForLayout(cells: ContentCell[], layout: CardLayout): boolean {
  const expectedCount = LAYOUT_CELL_COUNTS[layout]
  
  // Check cell count
  if (cells.length !== expectedCount) {
    return false
  }
  
  // Check that all cells are valid
  return cells.every(validateCell)
}

/**
 * Gets the expected cell count for a layout
 */
export function getLayoutCellCount(layout: CardLayout): number {
  return LAYOUT_CELL_COUNTS[layout]
}

/**
 * Validates and fixes layout inconsistencies
 * Ensures the layout matches the actual content
 */
export function validateAndFixLayout(
  cells: ContentCell[], 
  layout: CardLayout
): { cells: ContentCell[], layout: CardLayout } {
  const textCells = cells.filter(cell => cell.type === 'text' && cell.content?.trim())
  const mediaCells = cells.filter(cell => cell.type === 'media' && cell.mediaUrl)
  
  // Determine what layout we actually need based on content
  const optimalLayout = determineOptimalLayout(
    textCells.map(cell => cell.content).join('\n'),
    mediaCells[0]?.mediaUrl || null,
    layout
  )
  
  // If layout doesn't match content, fix it
  if (optimalLayout !== layout) {
    return {
      cells: normalizeCellsForLayout(cells, optimalLayout),
      layout: optimalLayout
    }
  }
  
  // If layout is correct, just normalize cells
  return {
    cells: normalizeCellsForLayout(cells, layout),
    layout
  }
} 