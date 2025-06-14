export interface ParsedCard {
  front: string;
  back: string;
  hint: string | null;
  frontImage: string | null;
  backImage: string | null;
  frontLayout?: string;
  backLayout?: string;
}

export interface ParseResult {
  cards: ParsedCard[];
  error?: string;
  warnings?: string[];
}

export async function parseFlashCardCsv(text: string): Promise<ParsedCard[]> {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  // Parse header to get column indices
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  const frontIndex = header.indexOf('front')
  const backIndex = header.indexOf('back')
  const hintIndex = header.indexOf('hint')
  const frontImageIndex = header.indexOf('front image')
  const backImageIndex = header.indexOf('back image')
  const frontLayoutIndex = header.indexOf('front layout')
  const backLayoutIndex = header.indexOf('back layout')
  
  // Skip header row and process data rows
  const cards: ParsedCard[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    
    const values = line.split(',').map(s => s.trim())
    if (values.length < 2) continue // Skip if not enough values
    
    // Parse values using indices from header
    const front = parseCsvValue(values[frontIndex] || '')
    const back = parseCsvValue(values[backIndex] || '')
    const hint = hintIndex >= 0 ? parseCsvValue(values[hintIndex] || '') || null : null
    const frontImage = frontImageIndex >= 0 ? parseCsvValue(values[frontImageIndex] || '') || null : null
    const backImage = backImageIndex >= 0 ? parseCsvValue(values[backImageIndex] || '') || null : null
    const frontLayout = frontLayoutIndex >= 0 ? parseCsvValue(values[frontLayoutIndex] || '') || 'default' : 'default'
    const backLayout = backLayoutIndex >= 0 ? parseCsvValue(values[backLayoutIndex] || '') || 'default' : 'default'
    
    if (!front || !back) continue // Skip if missing required fields
    
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
  
  return cards
}

// Helper function to properly parse CSV values
function parseCsvValue(value: string): string {
  if (!value) return ''
  // Remove surrounding quotes if present
  const unquoted = value.replace(/^"|"$/g, '')
  // Handle escaped quotes within quoted fields
  return unquoted.replace(/""/g, '"').trim()
} 