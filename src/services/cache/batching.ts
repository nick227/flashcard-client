import type { BatchEntry, CacheOptions } from './types'

export class BatchManager {
  private batchQueue: Map<string, BatchEntry<any>[]> = new Map()
  private batchTimeouts: Map<string, number> = new Map()
  private readonly DEFAULT_BATCH_WINDOW = 50

  constructor(private options: CacheOptions) {}

  async handleBatchedRequest<T>(
    key: string,
    fetcher: () => Promise<T>,
    onComplete: (data: T) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Add to batch queue
      if (!this.batchQueue.has(key)) {
        this.batchQueue.set(key, [])
      }
      const batch = this.batchQueue.get(key)!
      batch.push({ fetcher, resolve, reject })

      // Clear existing timeout
      if (this.batchTimeouts.has(key)) {
        clearTimeout(this.batchTimeouts.get(key)!)
      }

      // Set new timeout
      const timeoutId = window.setTimeout(async () => {
        try {
          const currentBatch = this.batchQueue.get(key) || []
          this.batchQueue.delete(key)
          this.batchTimeouts.delete(key)

          if (currentBatch.length === 0) return

          // Execute the first fetcher and share result
          const result = await currentBatch[0].fetcher()
          onComplete(result)
          currentBatch.forEach(entry => entry.resolve(result))
        } catch (error) {
          const currentBatch = this.batchQueue.get(key) || []
          this.batchQueue.delete(key)
          this.batchTimeouts.delete(key)
          currentBatch.forEach(entry => entry.reject(error))
        }
      }, this.options.batchWindow || this.DEFAULT_BATCH_WINDOW)

      this.batchTimeouts.set(key, timeoutId)

      // Auto-clear timeout after 5 seconds to prevent memory leaks
      setTimeout(() => {
        if (this.batchTimeouts.has(key)) {
          this.clearBatch(key)
        }
      }, 5000)
    })
  }

  clearBatch(key: string): void {
    const batch = this.batchQueue.get(key)
    if (batch) {
      batch.forEach(entry => entry.reject(new Error('Batch cleared')))
    }
    if (this.batchTimeouts.has(key)) {
      clearTimeout(this.batchTimeouts.get(key)!)
      this.batchTimeouts.delete(key)
    }
    this.batchQueue.delete(key)
  }

  clearAllBatches(): void {
    for (const [, batch] of this.batchQueue.entries()) {
      batch.forEach(entry => entry.reject(new Error('All batches cleared')))
    }
    for (const timeoutId of this.batchTimeouts.values()) {
      clearTimeout(timeoutId)
    }
    this.batchTimeouts.clear()
    this.batchQueue.clear()
  }
} 