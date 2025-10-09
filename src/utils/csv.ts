export interface ParsedCard {
  front: string
  back: string
  hint: string | null
  frontImage: string | null
  backImage: string | null
  frontLayout?: string
  backLayout?: string
}

export interface ParseResult {
  cards: ParsedCard[]
  error?: string
  warnings?: string[]
}

export async function parseFlashCardCsv(text: string): Promise<ParsedCard[]> {
  const lines = text.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []
  
  const header = parseCsvLine(lines[0]).map(h => h.toLowerCase())
  const frontIndex = header.indexOf('front')
  const backIndex = header.indexOf('back')
  const hintIndex = header.indexOf('hint')
  const frontImageIndex = header.indexOf('front image')
  const backImageIndex = header.indexOf('back image')
  const frontLayoutIndex = header.indexOf('front layout')
  const backLayoutIndex = header.indexOf('back layout')
  
  const cards: ParsedCard[] = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    
    const values = parseCsvLine(line)
    if (values.length < 2) continue
    
    const front = values[frontIndex] || ''
    const back = values[backIndex] || ''
    const hint = hintIndex >= 0 ? (values[hintIndex] || null) : null
    const frontImage = frontImageIndex >= 0 ? (values[frontImageIndex] || null) : null
    const backImage = backImageIndex >= 0 ? (values[backImageIndex] || null) : null
    const frontLayout = frontLayoutIndex >= 0 ? (values[frontLayoutIndex] || 'default') : 'default'
    const backLayout = backLayoutIndex >= 0 ? (values[backLayoutIndex] || 'default') : 'default'
    
    if (!front && !frontImage && !back && !backImage) continue
    
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

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
} 