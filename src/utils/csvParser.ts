import type { FlashCardDraft } from '@/types'

export interface CsvParseResult {
  cards: FlashCardDraft[]
  error?: string
}

/**
 * Parses CSV text into FlashCardDraft[].
 * Expects columns: front, back (header required, case-insensitive).
 * Returns { cards, error }.
 */
export function parseFlashCardCsv(csv: string): CsvParseResult {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean)
  if (lines.length < 2) {
    return { cards: [], error: 'CSV must have a header and at least one row.' }
  }
  const header = lines[0].split(',').map(h => h.trim().toLowerCase())
  const frontIdx = header.indexOf('front')
  const backIdx = header.indexOf('back')
  if (frontIdx === -1 || backIdx === -1) {
    return { cards: [], error: 'CSV header must include "front" and "back" columns.' }
  }
  const cards: FlashCardDraft[] = []
  for (let i = 1; i < lines.length; i++) {
    const row = lines[i].split(',')
    if (row.length < Math.max(frontIdx, backIdx) + 1) continue
    const front = row[frontIdx]?.trim() || ''
    const back = row[backIdx]?.trim() || ''
    if (!front && !back) continue // skip blank rows
    cards.push({ front, back })
  }
  if (cards.length === 0) {
    return { cards: [], error: 'No valid cards found in CSV.' }
  }
  return { cards }
} 