/**
 * Iconfont Source Plugin
 * Integrates Iconfont API, Parser, and Transformer
 */

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { SourcePlugin, IconMetadata } from '@picto/types'
import { IconfontClient } from './client'
import { IconfontTransformer } from './transformer'
import type { IconfontIcon } from './types'
import type { Logger } from '../../logger'
import type { IconfontSourceConfig } from '../../config'

export interface IconfontPluginOptions extends Omit<IconfontSourceConfig, 'type'> {
  logger?: Logger
  cwd?: string
}

export class IconfontSourcePlugin implements SourcePlugin {
  name = 'iconfont-source'
  version = '0.0.1'
  type = 'source' as const

  private client: IconfontClient
  private options: IconfontPluginOptions
  private logger?: Logger
  private cwd: string

  constructor(options: IconfontPluginOptions) {
    this.options = options
    this.logger = options.logger
    this.cwd = options.cwd || process.cwd()

    this.client = new IconfontClient(
      {
        token: options.token,
        timeout: 30000,
        retries: 3,
      },
      this.logger
    )
  }

  /**
   * Fetch icons from Iconfont
   */
  async fetch(_fetchOptions: Record<string, unknown> = {}): Promise<IconMetadata[]> {
    this.logger?.info('Fetching icons from Iconfont...')

    try {
      // Check if CSS URL is provided for local parsing
      if (this.options.cssUrl && this.options.cssUrl.startsWith('file://')) {
        return await this.fetchFromLocalCSS()
      }

      // Fetch from Iconfont API
      return await this.fetchFromAPI()
    } catch (error) {
      this.logger?.error('Failed to fetch icons from Iconfont')
      throw error
    }
  }

  /**
   * Fetch from Iconfont API
   */
  private async fetchFromAPI(): Promise<IconMetadata[]> {
    const projectId = this.options.projectId

    // Fetch icons from project
    const icons = await this.client.getProjectIcons(projectId)

    if (icons.length === 0) {
      this.logger?.warn('No icons found in Iconfont project')
      return []
    }

    // Apply filters
    const filteredIcons = this.applyFilters(icons)

    if (filteredIcons.length === 0) {
      this.logger?.warn('No icons match the filters')
      return []
    }

    // Download SVGs
    const svgResults = await this.client.downloadIconSVGs(filteredIcons, 5)

    // Transform to IconMetadata
    const projectUrl = `https://www.iconfont.cn/manage/index?manage_type=myprojects&projectId=${projectId}`
    const transformer = new IconfontTransformer(projectId, projectUrl, this.logger)
    const metadata = transformer.transform(svgResults)

    this.logger?.success(`Successfully fetched ${metadata.length} icon(s) from Iconfont`)
    return metadata
  }

  /**
   * Fetch from local CSS file
   */
  private async fetchFromLocalCSS(): Promise<IconMetadata[]> {
    const cssUrl = this.options.cssUrl!
    const cssPath = cssUrl.replace('file://', '')
    const fullPath = resolve(this.cwd, cssPath)

    this.logger?.info(`Parsing local CSS file: ${fullPath}`)

    try {
      const cssContent = await readFile(fullPath, 'utf-8')
      const cssIcons = this.client.parseCSSFile(cssContent)

      this.logger?.info(`Found ${cssIcons.length} icon(s) in CSS file`)

      // For CSS-only mode, we can't fetch SVGs directly
      // Return minimal metadata
      const metadata: IconMetadata[] = cssIcons.map(cssIcon => ({
        id: cssIcon.unicode,
        name: cssIcon.name,
        displayName: cssIcon.name,
        svg: '', // No SVG available from CSS
        width: 24,
        height: 24,
        source: {
          type: 'iconfont',
          url: fullPath,
          metadata: {
            className: cssIcon.className,
            unicode: cssIcon.unicode,
            content: cssIcon.content,
          },
        },
        generatedAt: new Date(),
      }))

      this.logger?.warn(
        'CSS-only mode: SVG content not available. Consider using API mode for full functionality.'
      )
      this.logger?.success(`Successfully parsed ${metadata.length} icon(s) from CSS`)

      return metadata
    } catch (error) {
      this.logger?.error(`Failed to read CSS file: ${fullPath}`)
      throw error
    }
  }

  /**
   * Apply filters to icons
   */
  private applyFilters(icons: IconfontIcon[]): IconfontIcon[] {
    if (!this.options.filters) {
      return icons
    }

    let filtered = [...icons]

    // Name pattern filter
    if (this.options.filters.namePattern) {
      const pattern =
        typeof this.options.filters.namePattern === 'string'
          ? new RegExp(this.options.filters.namePattern)
          : this.options.filters.namePattern

      filtered = filtered.filter(
        icon => pattern.test(icon.name) || pattern.test(icon.font_class || '')
      )
    }

    // Unicode filter
    if (this.options.filters.unicode && this.options.filters.unicode.length > 0) {
      const unicodes = new Set(this.options.filters.unicode)
      filtered = filtered.filter(icon => unicodes.has(icon.unicode || ''))
    }

    return filtered
  }

  /**
   * Setup hook (optional)
   */
  setup(): void {
    this.logger?.debug('Iconfont source plugin setup complete')
  }

  /**
   * Teardown hook (optional)
   */
  teardown(): void {
    this.logger?.debug('Iconfont source plugin teardown complete')
  }
}
