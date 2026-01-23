/**
 * Picto Engine
 * Core orchestration engine for icon processing
 */

import type { Config } from '../config'
import type { IconMetadata } from '@picto/types'
import { PluginManager } from '../plugins/manager'
import { Logger } from '../logger'
import { FigmaSourcePlugin } from '../sources/figma'
import { IconfontSourcePlugin } from '../sources/iconfont'
import { LocalSourcePlugin } from '../sources/local'
import { OptimizerPlugin } from '../processors/optimizer'
import { ColorAnalyzerPlugin } from '../processors/color-analyzer'
import { DeduplicatorPlugin } from '../processors/deduplicator'
import { ReactGeneratorPlugin } from '../generators/react'
import { VueGeneratorPlugin } from '../generators/vue'
import { SVGGeneratorPlugin } from '../generators/svg'
import { WebComponentsGeneratorPlugin } from '../generators/web-components'
import { CacheManager } from '../cache'
import type { GeneratedFile } from '@picto/types'

export interface EngineOptions {
  config: Config
  logger?: Logger
}

export class PictoEngine {
  private config: Config
  private logger: Logger
  private pluginManager: PluginManager
  private cacheManager: CacheManager

  constructor(options: EngineOptions) {
    this.config = options.config
    this.logger = options.logger || new Logger()
    this.pluginManager = new PluginManager(this.logger)
    this.cacheManager = new CacheManager({
      enabled: this.config.cache?.enabled,
      dir: this.config.cache?.dir,
      ttl: this.config.cache?.ttl,
      logger: this.logger,
    })
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Picto Engine...')

    // Initialize cache
    await this.cacheManager.initialize()

    // Register built-in source plugins
    for (const sourceConfig of this.config.sources) {
      if (sourceConfig.type === 'figma') {
        const plugin = new FigmaSourcePlugin({
          ...sourceConfig,
          logger: this.logger,
        })
        this.pluginManager.register(plugin)
      } else if (sourceConfig.type === 'iconfont') {
        const plugin = new IconfontSourcePlugin({
          ...sourceConfig,
          logger: this.logger,
        })
        this.pluginManager.register(plugin)
      } else if (sourceConfig.type === 'local') {
        const plugin = new LocalSourcePlugin({
          ...sourceConfig,
          logger: this.logger,
        })
        this.pluginManager.register(plugin)
      }
    }

    // Register built-in processor plugins
    if (this.config.optimization?.svgo) {
      const optimizerPlugin = new OptimizerPlugin({
        enabled: true,
        svgoConfig: this.config.optimization?.svgoConfig,
        logger: this.logger,
      })
      this.pluginManager.register(optimizerPlugin)
    }

    // Always register color analyzer
    const colorAnalyzerPlugin = new ColorAnalyzerPlugin({
      enabled: true,
      logger: this.logger,
    })
    this.pluginManager.register(colorAnalyzerPlugin)

    // Register deduplicator if needed
    const deduplicatorPlugin = new DeduplicatorPlugin({
      enabled: true,
      logger: this.logger,
    })
    this.pluginManager.register(deduplicatorPlugin)

    // Register built-in generator plugins
    for (const outputConfig of this.config.outputs) {
      if (outputConfig.type === 'react') {
        const plugin = new ReactGeneratorPlugin(
          {
            ...outputConfig,
            ...outputConfig.options,
            naming: this.config.naming,
          },
          this.logger
        )
        this.pluginManager.register(plugin)
      } else if (outputConfig.type === 'vue') {
        const plugin = new VueGeneratorPlugin(
          {
            ...outputConfig,
            ...outputConfig.options,
            naming: this.config.naming,
          },
          this.logger
        )
        this.pluginManager.register(plugin)
      } else if (outputConfig.type === 'svg') {
        const plugin = new SVGGeneratorPlugin(
          {
            ...outputConfig,
            ...outputConfig.options,
            naming: this.config.naming,
          },
          this.logger
        )
        this.pluginManager.register(plugin)
      } else if (outputConfig.type === 'web-components') {
        const plugin = new WebComponentsGeneratorPlugin({
          ...outputConfig.options,
          dir: outputConfig.dir,
          logger: this.logger,
          naming: this.config.naming,
        })
        this.pluginManager.register(plugin)
      }
      // TODO: Add more generator plugins (font, json, etc.)
    }

    // Initialize all plugins
    await this.pluginManager.initializeAll()

    this.logger.success('Engine initialized')
  }

  /**
   * Execute the icon processing pipeline
   */
  async execute(): Promise<{ icons: IconMetadata[]; files: GeneratedFile[] }> {
    this.logger.info('Starting icon processing pipeline...')

    const allIcons: IconMetadata[] = []

    // Step 1: Fetch icons from sources
    this.logger.info(`Processing ${this.config.sources.length} source(s)...`)
    for (const sourceConfig of this.config.sources) {
      this.logger.debug(`Fetching from source: ${sourceConfig.type}`)

      const sourceIcons = await this.fetchFromSource(sourceConfig)
      allIcons.push(...sourceIcons)
    }

    this.logger.success(`Fetched ${allIcons.length} icon(s)`)

    // Step 2: Process icons (optimization, transformation)
    this.logger.info('Processing icons...')
    const processedIcons = this.processIcons(allIcons)

    // Step 3: Generate outputs
    this.logger.info(`Generating ${this.config.outputs.length} output(s)...`)
    const allFiles: GeneratedFile[] = []

    for (const outputConfig of this.config.outputs) {
      this.logger.debug(`Generating ${outputConfig.type} output to: ${outputConfig.dir}`)

      const files = await this.generateOutput(processedIcons, outputConfig)
      allFiles.push(...files)
    }

    this.logger.success('Pipeline completed successfully!')

    return {
      icons: processedIcons,
      files: allFiles,
    }
  }

  /**
   * Fetch icons from a source
   */
  private async fetchFromSource(sourceConfig: Config['sources'][0]): Promise<IconMetadata[]> {
    // Get source plugin by type
    const plugins = this.pluginManager.getSourcePlugins()
    // Use exact match on plugin name prefix (e.g., 'figma-source' matches 'figma')
    const plugin = plugins.find(p => {
      const pluginType = p.name.split('-')[0]
      return pluginType === sourceConfig.type
    })

    if (!plugin) {
      this.logger.warn(`No plugin found for source type: ${sourceConfig.type}`)
      return []
    }

    // Generate cache key based on source config
    const cacheKey = this.generateCacheKey(sourceConfig)

    // Try to get from cache first
    const cached = await this.cacheManager.getCachedIcons(cacheKey)
    if (cached) {
      // Check if cache is still valid (within TTL)
      const cacheAge = await this.getCacheAge(cacheKey)
      const ttl = this.config.cache?.ttl || 3600

      if (cacheAge !== null && cacheAge < ttl) {
        this.logger.info(
          `Using cached icons for ${sourceConfig.type} (${cached.length} icons, age: ${Math.round(cacheAge)}s)`
        )
        return cached
      }

      this.logger.info(`Cache expired (age: ${cacheAge}s, ttl: ${ttl}s), refreshing...`)
    }

    // No cache or cache expired, fetch fresh
    try {
      this.logger.info(`Fetching icons from ${sourceConfig.type}...`)
      const icons = await plugin.fetch({})
      // Cache the results
      await this.cacheManager.cacheIcons(cacheKey, icons)
      return icons
    } catch (error) {
      // If fetch fails but we have cached data, use it as fallback
      if (cached) {
        this.logger.warn(
          `Failed to fetch fresh icons, using cached version: ${(error as Error).message}`
        )
        return cached
      }

      this.logger.error(`Failed to fetch from ${sourceConfig.type}: ${(error as Error).message}`)
      return []
    }
  }

  /**
   * Process icons (optimization, etc.)
   */
  private processIcons(icons: IconMetadata[]): IconMetadata[] {
    // TODO: Apply processors
    // - SVG optimization (SVGO)
    // - Naming transformations
    // - Color analysis
    // - Deduplication

    // For now, just return icons as-is
    return icons
  }

  /**
   * Generate output in specified format
   */
  private async generateOutput(
    icons: IconMetadata[],
    outputConfig: Config['outputs'][0]
  ): Promise<GeneratedFile[]> {
    // Get generator plugin by type
    const plugins = this.pluginManager.getGeneratorPlugins()
    // Use exact match on plugin name prefix (e.g., 'react-generator' matches 'react')
    const plugin = plugins.find(p => {
      const pluginType = p.name.split('-')[0]
      return pluginType === outputConfig.type
    })

    if (!plugin) {
      this.logger.warn(`No plugin found for output type: ${outputConfig.type}`)
      return []
    }

    try {
      return await plugin.generate(icons, outputConfig.options || {})
    } catch (error) {
      this.logger.error(`Failed to generate ${outputConfig.type}: ${(error as Error).message}`)
      return []
    }
  }

  /**
   * Get plugin manager
   */
  getPluginManager(): PluginManager {
    return this.pluginManager
  }

  /**
   * Get logger
   */
  getLogger(): Logger {
    return this.logger
  }

  /**
   * Generate cache key from source config
   * Uses a short hash to avoid filename length issues
   */
  private generateCacheKey(sourceConfig: Config['sources'][0]): string {
    const { type } = sourceConfig

    // Extract key fields based on source type
    let keyData: Record<string, unknown> = { type }

    if (type === 'figma') {
      const figmaConfig = sourceConfig as Config['sources'][0] & { type: 'figma' }
      // Extract fileKey from URL instead of storing full URL
      const fileKey = this.extractFileKey(figmaConfig.url)
      keyData = {
        type,
        fileKey,
        nodeIds: figmaConfig.nodeIds,
        filters: figmaConfig.filters,
      }
    } else if (type === 'iconfont') {
      const iconfontConfig = sourceConfig as Config['sources'][0] & { type: 'iconfont' }
      keyData = {
        type,
        projectId: iconfontConfig.projectId,
        filters: iconfontConfig.filters,
      }
    } else if (type === 'local') {
      const localConfig = sourceConfig as Config['sources'][0] & { type: 'local' }
      keyData = {
        type,
        dir: localConfig.dir,
        pattern: localConfig.pattern,
      }
    }

    // Generate short hash
    const hash = this.hashObject(keyData)

    return `${type}:${hash}`
  }

  /**
   * Extract Figma file key from URL
   */
  private extractFileKey(url: string): string | null {
    const match = url.match(/figma\.com\/(file|design)\/([a-zA-Z0-9]+)/)
    return match && match[2] ? match[2] : null
  }

  /**
   * Generate a short hash from an object
   */
  private hashObject(obj: Record<string, unknown>): string {
    const str = JSON.stringify(obj)
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).slice(0, 12)
  }

  /**
   * Get cache age in seconds
   */
  private async getCacheAge(cacheKey: string): Promise<number | null> {
    return await this.cacheManager.getCacheAge(cacheKey)
  }
}
