// Test file to verify layout toggling logic
import { normalizeCellsForLayout } from './cellUtils'
import type { CardLayout, ContentCell } from '@/types/card'

// Test data
const testCells = [
  { type: 'text', content: 'Sample text', mediaUrl: null },
  { type: 'media', content: '', mediaUrl: 'https://example.com/image.jpg' }
] as ContentCell[]

const emptyCells = [
  { type: 'text', content: '', mediaUrl: null }
] as ContentCell[]

const textOnlyCells = [
  { type: 'text', content: 'Only text content', mediaUrl: null }
] as ContentCell[]

const mediaOnlyCells = [
  { type: 'media', content: '', mediaUrl: 'https://example.com/image.jpg' }
] as ContentCell[]

// Test layout toggling scenarios
export function testLayoutToggling() {
  console.log('=== Layout Toggling Test ===')
  
  // Test 1: Default with both text and media
  console.log('\nTest 1: Default → Two-row (text + media)')
  const layout1 = 'default' as CardLayout
  const next1 = getNextLayout(layout1, testCells)
  console.log(`Current: ${layout1} → Next: ${next1}`)
  
  // Test 2: Two-row → Two-col
  console.log('\nTest 2: Two-row → Two-col')
  const layout2 = 'two-row' as CardLayout
  const next2 = getNextLayout(layout2, testCells)
  console.log(`Current: ${layout2} → Next: ${next2}`)
  
  // Test 3: Two-col → Default
  console.log('\nTest 3: Two-col → Default')
  const layout3 = 'two-col' as CardLayout
  const next3 = getNextLayout(layout3, testCells)
  console.log(`Current: ${layout3} → Next: ${next3}`)
  
  // Test 4: Default with text only
  console.log('\nTest 4: Default → Two-col (text only)')
  const next4 = getNextLayout(layout1, textOnlyCells)
  console.log(`Current: ${layout1} → Next: ${next4}`)
  
  // Test 5: Default with media only
  console.log('\nTest 5: Default → Two-col (media only)')
  const next5 = getNextLayout(layout1, mediaOnlyCells)
  console.log(`Current: ${layout1} → Next: ${next5}`)
  
  // Test 6: Default with empty content
  console.log('\nTest 6: Default → Two-col (empty)')
  const next6 = getNextLayout(layout1, emptyCells)
  console.log(`Current: ${layout1} → Next: ${next6}`)
  
  console.log('\n=== Layout Toggling Test Complete ===')
}

function getNextLayout(currentLayout: CardLayout, cells: ContentCell[]): CardLayout {
  const layouts: CardLayout[] = ['default', 'two-row', 'two-col']
  const currentIndex = layouts.indexOf(currentLayout)
  
  // Get next layout in cycle
  let nextLayout = layouts[(currentIndex + 1) % layouts.length]
  
  // Get current content
  const textCells = cells.filter(cell => cell.type === 'text' && cell.content?.trim())
  const mediaCells = cells.filter(cell => cell.type === 'media' && cell.mediaUrl)
  const hasText = textCells.length > 0
  const hasMedia = mediaCells.length > 0
  
  // Smart shortcut logic
  if (hasText && hasMedia && nextLayout === 'two-col' && currentLayout === 'default') {
    nextLayout = 'two-row'
  }
  
  return nextLayout
}

// Test cell normalization
export function testCellNormalization() {
  console.log('\n=== Cell Normalization Test ===')
  
  // Test 1: Two cells to default
  console.log('\nTest 1: Two cells → Default layout')
  const result1 = normalizeCellsForLayout(testCells, 'default')
  console.log(`Result: ${result1.length} cells, types: ${result1.map(c => c.type)}`)
  
  // Test 2: One cell to two-row
  console.log('\nTest 2: One cell → Two-row layout')
  const result2 = normalizeCellsForLayout(textOnlyCells, 'two-row')
  console.log(`Result: ${result2.length} cells, types: ${result2.map(c => c.type)}`)
  
  // Test 3: One cell to two-col
  console.log('\nTest 3: One cell → Two-col layout')
  const result3 = normalizeCellsForLayout(mediaOnlyCells, 'two-col')
  console.log(`Result: ${result3.length} cells, types: ${result3.map(c => c.type)}`)
  
  console.log('\n=== Cell Normalization Test Complete ===')
}

// Run tests
if (typeof window !== 'undefined') {
  // Only run in browser environment
  ;(window as any).testLayoutToggling = testLayoutToggling
  ;(window as any).testCellNormalization = testCellNormalization
} 