export function useFontSize() {
  const getFontSize = (text: string | undefined): string => {
    const length = text?.length || 0
    if (length > 500) return '1.4rem'
    if (length > 300) return '1.8rem'
    if (length > 150) return '2rem'
    return '2.2rem'
  }

  return {
    getFontSize
  }
} 