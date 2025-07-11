// useDynamicFontSize composable
// Scales font size based on text length and container size, with caching and sensible defaults

// =========================
// Types & Interfaces
// =========================
interface FontSizeOptions {
  width?: number
  height?: number
  cacheKey?: string
  debug?: boolean
}

interface TextStyle {
  fontSize: string
}

// =========================
// Constants
// =========================
const minChars = 20;
const maxChars = 200;
const minFontSize = 1;
const maxFontSize = 4;
const baseArea = 640 * 400;

// =========================
// Font Size Cache
// =========================
const fontSizeCache = new Map<string, string>()

function getFontSizeCache(key: string): string | undefined {
  return fontSizeCache.get(key);
}
function setFontSizeCache(key: string, value: string) {
  fontSizeCache.set(key, value);
}
export function clearFontSizeCache() {
  fontSizeCache.clear();
}
export function deleteFontSizeCacheKey(key: string) {
  fontSizeCache.delete(key)
}

// =========================
// SRP Helper Functions
// =========================
function charBasedFontSize(text: string): number {
  const len = text.length;
  if (len <= minChars) return maxFontSize;
  if (len >= maxChars) return minFontSize;
  const t = (len - minChars) / (maxChars - minChars);
  return maxFontSize + t * (minFontSize - maxFontSize);
}

function areaScaleFactor(width: number, height: number): number {
  const area = width * height;
  return Math.max(0.7, Math.min(1.5, Math.sqrt(area) / Math.sqrt(baseArea)));
}

function clampFontSize(fontSize: number): number {
  return Math.max(minFontSize, Math.min(fontSize, maxFontSize));
}

// =========================
// Main Font Size Calculation
// =========================
function tunedFontSize(
  text: string,
  width = 0,
  height = 0,
  _debug = false
): number {
  if (!text || width === 0 || height === 0) return minFontSize;
  const charFont = charBasedFontSize(text);
  const areaFactor = areaScaleFactor(width, height);
  let finalFontSize = charFont * areaFactor;
  finalFontSize = clampFontSize(finalFontSize);

  return finalFontSize;
}

// =========================
// Composable/Public API
// =========================
export function useDynamicFontSize() {
  const getTextStyle = (text: string, options: FontSizeOptions = {}): TextStyle => {
    const {
      width = 0,
      height = 0,
      cacheKey,
      debug = false
    } = options;
    // Compose a cache key from all relevant params
    const cacheKeyWithParams = cacheKey
      ? `${cacheKey}-${text}-${width}x${height}`
      : undefined;
    if (cacheKeyWithParams) {
      const cached = getFontSizeCache(cacheKeyWithParams);
      if (cached) return { fontSize: cached };
    }
    const fontSizeNum = tunedFontSize(
      text,
      width,
      height,
      debug
    );
    const fontSize = `${fontSizeNum.toFixed(2)}rem`;
    if (cacheKeyWithParams) setFontSizeCache(cacheKeyWithParams, fontSize);
    return { fontSize };
  };
  return { getTextStyle };
}

