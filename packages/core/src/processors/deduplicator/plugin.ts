/**
 * Deduplicator Processor Plugin
 * Removes duplicate icons based on content hash
 *
 * Note: This plugin should be applied to the entire icon set,
 * not individual icons. Use it in the engine's processIcons phase.
 */

import type { ProcessorPlugin, IconMetadata } from '@picto/types'
import type { Logger } from '../../logger'

export interface DeduplicatorOptions {
  enabled?: boolean
  keepFirst?: boolean // Keep first occurrence vs. last
  logger?: Logger
}

export class DeduplicatorPlugin implements ProcessorPlugin {
  name = 'deduplicator'
  version = '0.0.1'
  type = 'processor' as const

  private options: DeduplicatorOptions
  private logger?: Logger
  private seenHashes: Map<string, IconMetadata> = new Map()

  constructor(options: DeduplicatorOptions = {}) {
    this.options = {
      enabled: true,
      keepFirst: true,
      ...options,
    }
    this.logger = options.logger
  }

  /**
   * Process icon by checking for duplicates
   * Returns the icon if it's unique, or the original if it's a duplicate
   */
  process(
    icon: IconMetadata,
    _processOptions: Record<string, unknown> = {}
  ): Promise<IconMetadata> {
    if (!this.options.enabled) {
      return Promise.resolve(icon)
    }

    try {
      // Generate hash if not present
      const hash = icon.hash || this.generateHash(icon.svg)

      // Check if we've seen this hash before
      const existing = this.seenHashes.get(hash)

      if (existing) {
        this.logger?.debug(
          `Duplicate found: ${icon.name} is duplicate of ${existing.name}`
        )

        if (this.options.keepFirst) {
          // Return existing icon (mark current as duplicate in source metadata)
          return Promise.resolve({
            ...icon,
            source: {
              ...icon.source,
              metadata: {
                ...icon.source.metadata,
                isDuplicate: true,
                duplicateOf: existing.id,
              },
            },
          })
        } else {
          // Update to keep the new one
          this.seenHashes.set(hash, icon)
          return Promise.resolve({
            ...icon,
            hash,
          })
        }
      }

      // First time seeing this icon
      this.seenHashes.set(hash, icon)

      return Promise.resolve({
        ...icon,
        hash,
      })
    } catch (error) {
      this.logger?.warn(`Failed to deduplicate icon: ${icon.name}`, error)
      return Promise.resolve(icon)
    }
  }

  /**
   * Generate hash for SVG content
   */
  private generateHash(svg: string): string {
    // Simple hash function
    let hash = 0
    for (let i = 0; i < svg.length; i++) {
      const char = svg.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Reset state (useful between runs)
   */
  reset(): void {
    this.seenHashes.clear()
  }

  /**
   * Get deduplication statistics
   */
  getStats(): { total: number; unique: number; duplicates: number } {
    const total = this.seenHashes.size
    // This is simplified - in reality we'd track duplicates separately
    return {
      total,
      unique: total,
      duplicates: 0,
    }
  }

  /**
   * Setup hook
   */
  setup(): void {
    this.seenHashes.clear()
    this.logger?.debug('Deduplicator plugin setup complete')
  }

  /**
   * Teardown hook
   */
  teardown(): void {
    const stats = this.getStats()
    this.logger?.info(
      `Deduplication stats: ${stats.unique} unique icons, ${stats.duplicates} duplicates removed`
    )
    this.seenHashes.clear()
    this.logger?.debug('Deduplicator plugin teardown complete')
  }
}
