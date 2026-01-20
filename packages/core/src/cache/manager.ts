/**
 * Cache Manager
 * Manages file system cache for icons and metadata
 */

import { readFile, writeFile, mkdir, unlink, readdir, stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { existsSync } from 'node:fs'
import type { IconMetadata } from '@picto/types'
import type { Logger } from '../logger'

export interface CacheOptions {
  enabled?: boolean
  dir?: string
  ttl?: number // Time to live in seconds
  logger?: Logger
}

export interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  ttl: number
}

export class CacheManager {
  private enabled: boolean
  private cacheDir: string
  private ttl: number
  private logger?: Logger

  constructor(options: CacheOptions = {}) {
    this.enabled = options.enabled ?? true
    this.cacheDir = options.dir || '.picto/cache'
    this.ttl = options.ttl || 3600 // Default 1 hour
    this.logger = options.logger
  }

  /**
   * Initialize cache directory
   */
  async initialize(): Promise<void> {
    if (!this.enabled) {
      this.logger?.debug('Cache is disabled')
      return
    }

    try {
      if (!existsSync(this.cacheDir)) {
        await mkdir(this.cacheDir, { recursive: true })
        this.logger?.debug(`Cache directory created: ${this.cacheDir}`)
      }
    } catch (error) {
      this.logger?.warn(`Failed to initialize cache directory:`, error)
      this.enabled = false
    }
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) {
      return null
    }

    try {
      const cachePath = this.getCachePath(key)

      if (!existsSync(cachePath)) {
        return null
      }

      const content = await readFile(cachePath, 'utf-8')
      const entry = JSON.parse(content) as CacheEntry<T>

      // Check if cache is expired
      if (this.isExpired(entry)) {
        this.logger?.debug(`Cache expired for key: ${key}`)
        await this.delete(key)
        return null
      }

      this.logger?.debug(`Cache hit for key: ${key}`)
      return entry.value
    } catch (error) {
      this.logger?.warn(`Failed to read cache for key: ${key}`, error)
      return null
    }
  }

  /**
   * Set cached value
   */
  async set<T>(key: string, value: T, customTtl?: number): Promise<void> {
    if (!this.enabled) {
      return
    }

    try {
      const cachePath = this.getCachePath(key)
      const cacheDir = dirname(cachePath)

      // Ensure directory exists
      if (!existsSync(cacheDir)) {
        await mkdir(cacheDir, { recursive: true })
      }

      const entry: CacheEntry<T> = {
        key,
        value,
        timestamp: Date.now(),
        ttl: customTtl || this.ttl,
      }

      await writeFile(cachePath, JSON.stringify(entry, null, 2), 'utf-8')
      this.logger?.debug(`Cache set for key: ${key}`)
    } catch (error) {
      this.logger?.warn(`Failed to write cache for key: ${key}`, error)
    }
  }

  /**
   * Delete cached value
   */
  async delete(key: string): Promise<void> {
    if (!this.enabled) {
      return
    }

    try {
      const cachePath = this.getCachePath(key)

      if (existsSync(cachePath)) {
        await unlink(cachePath)
        this.logger?.debug(`Cache deleted for key: ${key}`)
      }
    } catch (error) {
      this.logger?.warn(`Failed to delete cache for key: ${key}`, error)
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.enabled) {
      return
    }

    try {
      const files = await this.listCacheFiles()

      for (const file of files) {
        await unlink(file)
      }

      this.logger?.info(`Cleared ${files.length} cache file(s)`)
    } catch (error) {
      this.logger?.error('Failed to clear cache:', error)
    }
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpired(): Promise<void> {
    if (!this.enabled) {
      return
    }

    try {
      const files = await this.listCacheFiles()
      let cleanedCount = 0

      for (const file of files) {
        try {
          const content = await readFile(file, 'utf-8')
          const entry = JSON.parse(content) as CacheEntry<unknown>

          if (this.isExpired(entry)) {
            await unlink(file)
            cleanedCount++
          }
        } catch {
          // Ignore errors for individual files
        }
      }

      this.logger?.info(`Cleaned ${cleanedCount} expired cache file(s)`)
    } catch (error) {
      this.logger?.error('Failed to clean expired cache:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    enabled: boolean
    totalFiles: number
    totalSize: number
    expiredFiles: number
  }> {
    if (!this.enabled) {
      return {
        enabled: false,
        totalFiles: 0,
        totalSize: 0,
        expiredFiles: 0,
      }
    }

    try {
      const files = await this.listCacheFiles()
      let totalSize = 0
      let expiredFiles = 0

      for (const file of files) {
        try {
          const stats = await stat(file)
          totalSize += stats.size

          const content = await readFile(file, 'utf-8')
          const entry = JSON.parse(content) as CacheEntry<unknown>

          if (this.isExpired(entry)) {
            expiredFiles++
          }
        } catch {
          // Ignore errors for individual files
        }
      }

      return {
        enabled: true,
        totalFiles: files.length,
        totalSize,
        expiredFiles,
      }
    } catch {
      return {
        enabled: true,
        totalFiles: 0,
        totalSize: 0,
        expiredFiles: 0,
      }
    }
  }

  /**
   * Cache icons metadata
   */
  async cacheIcons(sourceKey: string, icons: IconMetadata[]): Promise<void> {
    const key = `icons:${sourceKey}`
    await this.set(key, icons)
  }

  /**
   * Get cached icons metadata
   */
  async getCachedIcons(sourceKey: string): Promise<IconMetadata[] | null> {
    const key = `icons:${sourceKey}`
    return await this.get<IconMetadata[]>(key)
  }

  /**
   * Get cache path for a key
   */
  private getCachePath(key: string): string {
    // Sanitize key for filename
    const sanitized = key.replace(/[^a-zA-Z0-9-_:]/g, '_')
    return join(this.cacheDir, `${sanitized}.json`)
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<unknown>): boolean {
    const now = Date.now()
    const age = (now - entry.timestamp) / 1000 // Convert to seconds
    return age > entry.ttl
  }

  /**
   * List all cache files
   */
  private async listCacheFiles(): Promise<string[]> {
    if (!existsSync(this.cacheDir)) {
      return []
    }

    try {
      const files = await readdir(this.cacheDir)
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => join(this.cacheDir, file))
    } catch {
      return []
    }
  }
}
