import type { ParsedCard, ParseResult } from '@/utils/csv'

export function parseCSV(csvContent: string): ParseResult {
  const warnings: string[] = []
  const cards: ParsedCard[] = []

  try {
    // Normalize line endings and split into lines
    const normalizedContent = csvContent.replace(/\r\n/g, '\n')
    const lines = normalizedContent.split('\n').filter(line => line.trim())
    
    // Check if we have a header
    if (lines.length === 0) {
      return { cards: [], error: 'Empty file' }
    }

    // Parse header
    const header = parseCsvLine(lines[0]).map(h => h.trim().toLowerCase())
    const requiredFields = ['front', 'back']
    const missingFields = requiredFields.filter(field => !header.includes(field))
    
    if (missingFields.length > 0) {
      return { 
        cards: [], 
        error: `Missing required fields: ${missingFields.join(', ')}` 
      }
    }

    // Get column indices
    const frontIndex = header.indexOf('front')
    const backIndex = header.indexOf('back')
    const hintIndex = header.indexOf('hint')
    const frontImageIndex = header.indexOf('front image')
    const backImageIndex = header.indexOf('back image')
    const frontLayoutIndex = header.indexOf('front layout')
    const backLayoutIndex = header.indexOf('back layout')

    // Process each line
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      const values = parseCsvLine(line)
      
      // Skip empty lines
      if (values.every(v => !v.trim())) continue

      // Extract and parse values
      const front = parseCsvValue(values[frontIndex] || '')
      const back = parseCsvValue(values[backIndex] || '')
      const hint = hintIndex >= 0 ? parseCsvValue(values[hintIndex] || '') || null : null
      const frontImage = frontImageIndex >= 0 ? parseCsvValue(values[frontImageIndex] || '') || null : null
      const backImage = backImageIndex >= 0 ? parseCsvValue(values[backImageIndex] || '') || null : null
      let frontLayout = frontLayoutIndex >= 0 ? parseCsvValue(values[frontLayoutIndex] || '') || 'default' : 'default'
      let backLayout = backLayoutIndex >= 0 ? parseCsvValue(values[backLayoutIndex] || '') || 'default' : 'default'

      // Debug log the parsed values
      console.log(`Parsed line ${i + 1}:`, {
        front,
        back,
        hint,
        frontImage,
        backImage,
        frontLayout,
        backLayout,
        rawValues: values
      })

      // Validate required fields - allow either text or image
      if (!front && !frontImage && !back && !backImage) {
        warnings.push(`Line ${i + 1}: Skipped - missing content`)
        continue
      }

      // Validate image URLs if present
      if (frontImage && !isValidUrl(frontImage)) {
        warnings.push(`Line ${i + 1}: Invalid front image URL`)
        continue
      }
      if (backImage && !isValidUrl(backImage)) {
        warnings.push(`Line ${i + 1}: Invalid back image URL`)
        continue
      }

      // Validate layouts
      const validLayouts = ['default', 'two-row', 'two-col']
      if (!validLayouts.includes(frontLayout)) {
        warnings.push(`Line ${i + 1}: Invalid front layout, using default`)
        frontLayout = 'default'
      }
      if (!validLayouts.includes(backLayout)) {
        warnings.push(`Line ${i + 1}: Invalid back layout, using default`)
        backLayout = 'default'
      }

      cards.push({
        front,
        back,
        hint,
        frontImage,
        backImage,
        frontLayout,
        backLayout
      })
    }

    if (cards.length === 0) {
      return { cards: [], error: 'No valid cards found in CSV' }
    }

    return { cards, warnings: warnings.length ? warnings : undefined }
  } catch (e) {
    console.error('CSV parsing error:', e)
    return { cards: [], error: 'Failed to parse CSV file' }
  }
}

// Helper function to validate URLs
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Helper function to properly parse CSV values
function parseCsvValue(value: string): string {
  if (!value) return ''
  // Remove surrounding quotes if present
  const unquoted = value.replace(/^"|"$/g, '')
  // Handle escaped quotes within quoted fields
  return unquoted.replace(/""/g, '"').trim()
}

// Helper function to parse a CSV line properly handling quoted values
function parseCsvLine(line: string): string[] {
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
      values.push(currentValue)
      currentValue = ''
    } else {
      currentValue += char
    }
  }
  
  // Add the last value
  values.push(currentValue)
  return values
} 