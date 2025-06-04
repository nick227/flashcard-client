import type { Card } from '@/types/card'
import { CardService } from '@/services/CardService'

export interface CsvParseResult {
  cards: Card[]
  error?: string
  warnings?: string[]
}

/**
 * Parses CSV text into FlashCardDraft[].
 * Supports:
 * - Required columns: front, back
 * - Optional columns: hint, front_image, back_image
 * - Handles quoted fields with commas and newlines
 * - Validates image URLs
 * - Supports both CRLF and LF line endings
 * - Trims whitespace from fields
 * Returns { cards, error?, warnings? }
 */
export function parseFlashCardCsv(csvContent: string): CsvParseResult {
  try {
    // Normalize line endings and split
    const normalizedContent = csvContent.replace(/\r\n/g, '\n')
    const lines = normalizedContent.split('\n')
      .map(line => line.trim())
      .filter(line => line)

    if (lines.length < 2) {
      return { cards: [], error: 'CSV must have at least a header row and one data row' }
    }

    // Parse headers with case-insensitive matching
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
    const requiredHeaders = ['front', 'back']
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return { cards: [], error: `Missing required headers: ${missingHeaders.join(', ')}` }
    }

    const warnings: string[] = []
    const cards: Card[] = []

    // Helper to parse CSV field with proper quote handling
    const parseField = (value: string): string => {
      // Remove surrounding quotes if present and handle empty quoted strings
      const unquoted = value.replace(/^"|"$/g, '')
      // Handle escaped quotes within quoted fields
      return unquoted.replace(/""/g, '"')
    }

    // Helper to extract values from a CSV row
    const extractValues = (line: string): string[] => {
      const values: string[] = []
      let currentValue = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            // Handle escaped quotes
            currentValue += '"'
            i++
          } else {
            inQuotes = !inQuotes
          }
        } else if (char === ',' && !inQuotes) {
          values.push(parseField(currentValue))
          currentValue = ''
        } else {
          currentValue += char
        }
      }
      
      // Add the last value
      values.push(parseField(currentValue))
      return values
    }

    // Get header indices
    const frontIndex = headers.indexOf('front')
    const backIndex = headers.indexOf('back')
    const frontImageIndex = headers.indexOf('front image')
    const backImageIndex = headers.indexOf('back image')
    const hintIndex = headers.indexOf('hint')

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const values = extractValues(line)

      if (values.length < headers.length) {
        return { 
          cards: [], 
          error: `Row ${i + 1} has fewer values than headers. Expected ${headers.length}, got ${values.length}` 
        }
      }

      // Get values for each field
      const frontText = values[frontIndex]
      const backText = values[backIndex]
      const frontImage = frontImageIndex >= 0 ? values[frontImageIndex] : null
      const backImage = backImageIndex >= 0 ? values[backImageIndex] : null
      
      // Debug log the values
      console.log(`Row ${i + 1} values:`, {
        frontText,
        backText,
        frontImage,
        backImage,
        headers,
        values,
        indices: {
          front: frontIndex,
          back: backIndex,
          frontImage: frontImageIndex,
          backImage: backImageIndex
        }
      })

      // Validate image URLs if present
      let validFrontImage = frontImage && frontImage.trim() ? frontImage.trim() : null
      let validBackImage = backImage && backImage.trim() ? backImage.trim() : null

      if (validFrontImage && !isValidUrl(validFrontImage)) {
        warnings.push(`Row ${i + 1}: Invalid front image URL`)
        validFrontImage = null
      }
      if (validBackImage && !isValidUrl(validBackImage)) {
        warnings.push(`Row ${i + 1}: Invalid back image URL`)
        validBackImage = null
      }

      // A card is valid if it has either text or a valid image for both front and back
      const hasValidFront = (frontText && frontText.trim()) || validFrontImage
      const hasValidBack = (backText && backText.trim()) || validBackImage

      if (!hasValidFront) {
        warnings.push(`Row ${i + 1}: Empty front text and no valid front image`)
        continue
      }
      if (!hasValidBack) {
        warnings.push(`Row ${i + 1}: Empty back text and no valid back image`)
        continue
      }

      const card: Card = {
        id: CardService.generateId(),
        front: {
          text: frontText ? frontText.trim() : '',
          imageUrl: validFrontImage
        },
        back: {
          text: backText ? backText.trim() : '',
          imageUrl: validBackImage
        },
        hint: hintIndex >= 0 ? values[hintIndex] || null : null,
        setId: 0
      }

      cards.push(card)
    }

    // Validate total number of cards
    if (cards.length === 0) {
      return { cards: [], error: 'No valid cards found in CSV' }
    }

    return { 
      cards,
      warnings: warnings.length > 0 ? warnings : undefined
    }
  } catch (error) {
    console.error('CSV parsing error:', error)
    return { 
      cards: [], 
      error: error instanceof Error ? error.message : 'Failed to parse CSV file'
    }
  }
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
} 