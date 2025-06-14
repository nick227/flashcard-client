export interface ParsedCard {
  front: string;
  back: string;
  hint: string | null;
  frontImage: string | null;
  backImage: string | null;
}

export interface ParseResult {
  cards: ParsedCard[];
  error?: string;
  warnings?: string[];
}

export async function parseFlashCardCsv(text: string): Promise<ParsedCard[]> {
  const lines = text.split('\n')
  const cards: ParsedCard[] = []
  
  for (const line of lines) {
    if (!line.trim()) continue
    
    const [front, back, hint] = line.split(',').map(s => s.trim())
    if (!front || !back) continue
    
    cards.push({
      front,
      back,
      hint: hint || null,
      frontImage: null,
      backImage: null
    })
  }
  
  return cards
} 