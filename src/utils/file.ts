// Utility to convert base64 data URL to File
export function base64ToFile(base64: string, filename: string, mimeType?: string): File {
  const arr = base64.split(',')
  const mime = mimeType || arr[0].match(/:(.*?);/)?.[1] || ''
  const bstr = atob(arr[1])
  let n = bstr.length
  const u8arr = new Uint8Array(n)
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n)
  }
  return new File([u8arr], filename, { type: mime })
} 