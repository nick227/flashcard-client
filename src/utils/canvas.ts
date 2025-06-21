/**
 * Asynchronously creates a Blob from a canvas element.
 * This promisifies the canvas.toBlob callback API and supports OffscreenCanvas.
 *
 * @param canvas The canvas or OffscreenCanvas to convert.
 * @param mimeType The MIME type for the output image format.
 * @param quality The quality of the output image (for formats that support it).
 * @returns A promise that resolves with the created Blob.
 */
export async function createCanvasBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  mimeType: string,
  quality: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (canvas instanceof OffscreenCanvas) {
      canvas.convertToBlob({ type: mimeType, quality }).then(resolve).catch(reject);
    } else {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob from canvas'));
        }
      }, mimeType, quality);
    }
  });
} 