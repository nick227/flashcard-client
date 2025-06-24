// Simple, robust dynamic font size composable
// Scales font size based on text length and container size, with caching

interface FontSizeOptions {
  width?: number
  height?: number
  cacheKey?: string
  debug?: boolean
}

interface TextStyle {
  fontSize: string
}

// In-memory cache for font size calculations
const fontSizeCache = new Map<string, string>()

// Main scaling function: adjusts font size by text length and container area
function simpleFontSize(text: string, width = 0, height = 0): number {
  if (!text || width === 0 || height === 0) return 1.5;
  const base = 2.5;
  const lengthFactor = Math.max(0.6, 1 - (text.length / 100)); // Shrink for long text
  const area = width * height;
  const areaFactor = Math.max(0.8, Math.min(2, Math.sqrt(area) / 200)); // Grow for big containers
  return Math.max(1, Math.min(base * lengthFactor * areaFactor, 4)); // Clamp to 1-4rem
}

export function useDynamicFontSize() {
  const getTextStyle = (text: string, options: FontSizeOptions = {}): TextStyle => {
    const { width = 0, height = 0, cacheKey, debug = false } = options;
    const cacheKeyWithText = cacheKey ? `${cacheKey}-${text}` : undefined;
    if (cacheKeyWithText && fontSizeCache.has(cacheKeyWithText)) {
      if (debug) console.log('[FontSize] Cache hit:', cacheKeyWithText, fontSizeCache.get(cacheKeyWithText));
      return { fontSize: fontSizeCache.get(cacheKeyWithText)! };
    }
    const fontSizeNum = simpleFontSize(text, width, height);
    const fontSize = `${fontSizeNum.toFixed(2)}rem`;
    if (cacheKeyWithText) fontSizeCache.set(cacheKeyWithText, fontSize);
    if (debug) {
      console.log('[FontSize] Calculated:', { text, width, height, fontSize });
    }
    return { fontSize };
  };
  return { getTextStyle };
}

export function clearFontSizeCache() {
  fontSizeCache.clear();
}

export function deleteFontSizeCacheKey(key: string) {
  fontSizeCache.delete(key)
}

