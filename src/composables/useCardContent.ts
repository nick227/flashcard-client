import { ref, computed } from 'vue'

/**
 * Supported card layouts
 */
export type CardLayout = 'default' | 'two-column' | 'two-row'

/**
 * Returns the number of content areas for a given layout
 */
function getAreaCount(layout: CardLayout): number {
  switch (layout) {
    case 'two-column':
    case 'two-row':
      return 2
    default:
      return 1
  }
}

/**
 * Extracts content areas from layout HTML for any number of areas
 */
function extractContentAreas(html: string, areaCount = 2): string[] {
  const div = document.createElement('div')
  div.innerHTML = html
  const areas = div.querySelectorAll('.content-area')
  return Array.from({ length: areaCount }, (_, i) => areas[i]?.innerHTML || '')
}

/**
 * Wraps content areas in a layout HTML structure
 */
function wrapContentInLayout(type: CardLayout, contents: string[]): string {
  if (type === 'default') return contents[0] || ''
  return `<div class="layout-${type}">
    ${contents.map(c => `<div class="content-area">${c}</div>`).join('')}
  </div>`
}

/**
 * Card content composable for flexible layout/content state
 */
export function useCardContent(initialText: string) {
  const layoutTypes: CardLayout[] = ['default', 'two-column', 'two-row']
  const layout = ref<CardLayout>('default')
  const contentAreas = ref<string[]>([''])

  /**
   * Computed number of content areas for the current layout
   */
  const areaCount = computed(() => getAreaCount(layout.value))

  /**
   * Set the number of content areas (for future extensibility)
   */
  function setAreaCount(count: number) {
    if (count < 1) return
    while (contentAreas.value.length < count) contentAreas.value.push('')
    if (contentAreas.value.length > count) contentAreas.value.length = count
  }

  /**
   * Initialize content/layout state from text (plain or HTML)
   */
  function initialize(text: string) {
    console.log('useCardContent - Initializing with text:', text);
    if (text.trim().startsWith('<div class="layout-')) {
      // Try to detect layout type
      let detected: CardLayout = 'default'
      if (text.includes('layout-two-column')) detected = 'two-column'
      else if (text.includes('layout-two-row')) detected = 'two-row'
      layout.value = detected
      contentAreas.value = extractContentAreas(text, getAreaCount(detected))
    } else {
      layout.value = 'default'
      contentAreas.value = [text]
    }
    setAreaCount(getAreaCount(layout.value))
    console.log('useCardContent - Initialized content areas:', contentAreas.value);
  }

  /**
   * Handle input in a content area
   */
  function onInput(idx: number, e: Event, emit: (val: string) => void) {
    const content = (e.target as HTMLElement).innerHTML;
    contentAreas.value[idx] = content;
    console.log('useCardContent - Content updated:', { idx, content, contentAreas: contentAreas.value });
    emit(getCurrentText())
  }

  /**
   * Get the current text value (HTML or plain) for saving
   */
  function getCurrentText(): string {
    const text = wrapContentInLayout(layout.value, contentAreas.value);
    console.log('useCardContent - Getting current text:', text);
    return text;
  }

  /**
   * Cycle to the next layout and update content areas accordingly
   */
  function toggleLayout(emit: (val: string) => void) {
    const idx = layoutTypes.indexOf(layout.value)
    const next = layoutTypes[(idx + 1) % layoutTypes.length]
    // If switching to default, merge all content areas into one plain text
    if (next === 'default') {
      const merged = contentAreas.value.join('\n').replace(/<[^>]+>/g, '')
      contentAreas.value = [merged]
      layout.value = 'default'
      emit(getCurrentText())
    } else {
      // If coming from default, split or create two areas
      if (layout.value === 'default') {
        contentAreas.value = [contentAreas.value[0], '']
      }
      layout.value = next
      setAreaCount(getAreaCount(next))
      emit(getCurrentText())
    }
  }

  // Initialize with the initial text
  initialize(initialText)

  return {
    layout,
    contentAreas,
    areaCount,
    layoutTypes,
    initialize,
    onInput,
    toggleLayout,
    getCurrentText,
    setAreaCount,
    extractContentAreas,
    wrapContentInLayout,
  }
} 