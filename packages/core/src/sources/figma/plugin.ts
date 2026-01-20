/**
 * Figma Source Plugin
 * Integrates Figma API, Parser, and Transformer
 */

import type { SourcePlugin, IconMetadata } from '@picto/types'
import { FigmaClient } from './client'
import { FigmaParser } from './parser'
import { FigmaTransformer } from './transformer'
import type { Logger } from '../../logger'
import type { FigmaSourceConfig } from '../../config'

export interface FigmaPluginOptions extends Omit<FigmaSourceConfig, 'type'> {
  logger?: Logger
}

export class FigmaSourcePlugin implements SourcePlugin {
  name = 'figma-source'
  version = '0.0.1'
  type = 'source' as const

  private client: FigmaClient
  private parser: FigmaParser
  private options: FigmaPluginOptions
  private logger?: Logger

  constructor(options: FigmaPluginOptions) {
    this.options = options
    this.logger = options.logger

    this.client = new FigmaClient(
      {
        token: options.token,
        timeout: 30000,
        retries: 3,
        concurrency: 5,
      },
      this.logger
    )

    this.parser = new FigmaParser(this.logger)
  }

  /**
   * Fetch icons from Figma
   */
  async fetch(_options: Record<string, unknown> = {}): Promise<IconMetadata[]> {
    this.logger?.info('Fetching icons from Figma...')

    try {
      // Extract file key from URL
      const fileKey = this.extractFileKey(this.options.url)
      if (!fileKey) {
        throw new Error('Invalid Figma URL. Expected format: https://figma.com/file/FILE_KEY/...')
      }

      // Fetch file data
      const file = await this.client.getFile(fileKey)

      // Parse document tree to find icons
      const icons = this.parser.parseFile(file, {
        includeComponents: this.options.includeComponents ?? true,
        includeInstances: this.options.includeInstances ?? false,
        namePattern: this.options.filters?.namePattern
          ? typeof this.options.filters.namePattern === 'string'
            ? new RegExp(this.options.filters.namePattern)
            : this.options.filters.namePattern
          : undefined,
        categories: this.options.filters?.categories,
      })

      if (icons.length === 0) {
        this.logger?.warn('No icons found in Figma file')
        return []
      }

      // Export images (SVG)
      const nodeIds = icons.map(icon => icon.id)
      const imageResponse = await this.client.getImages(fileKey, nodeIds, { format: 'svg' })

      // Download SVGs
      const downloadUrls = Object.entries(imageResponse.images).map(([id, url]) => ({
        id,
        url,
      }))

      const svgResults = await this.client.downloadSVGs(downloadUrls)

      // Build SVG map
      const svgMap = new Map<string, string>()
      svgResults.forEach(({ id, svg }) => {
        svgMap.set(id, svg)
      })

      // Transform to IconMetadata
      const transformer = new FigmaTransformer(fileKey, this.options.url, this.logger)
      const metadata = transformer.transform(icons, svgMap)

      this.logger?.success(`Successfully fetched ${metadata.length} icon(s) from Figma`)
      return metadata
    } catch (error) {
      this.logger?.error('Failed to fetch icons from Figma')
      throw error
    }
  }

  /**
   * Extract Figma file key from URL
   */
  private extractFileKey(url: string): string | null {
    // Format: https://www.figma.com/file/FILE_KEY/...
    // Or: https://www.figma.com/design/FILE_KEY/...
    const match = url.match(/figma\.com\/(file|design)\/([a-zA-Z0-9]+)/)
    return match && match[2] ? match[2] : null
  }

  /**
   * Setup hook (optional)
   */
  setup(): void {
    this.logger?.debug('Figma source plugin setup complete')
  }

  /**
   * Teardown hook (optional)
   */
  teardown(): void {
    this.logger?.debug('Figma source plugin teardown complete')
  }
}
