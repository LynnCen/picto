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
import { CacheManager, ChangeDetector } from '../cache'
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
  private changeDetector: ChangeDetector

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
    this.changeDetector = new ChangeDetector(this.logger)
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
      }
      // TODO: Add more generator plugins
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
    const cacheKey = `${sourceConfig.type}:${JSON.stringify(sourceConfig)}`

    // Try to get from cache first
    const cached = await this.cacheManager.getCachedIcons(cacheKey)
    if (cached) {
      this.logger.info(`Using cached icons for ${sourceConfig.type} (${cached.length} icons)`)

      // Fetch fresh icons in background for comparison
      try {
        const fresh = await plugin.fetch({})

        // Detect changes
        const changes = this.changeDetector.detectChanges(cached, fresh)

        if (this.changeDetector.shouldUseIncremental(changes)) {
          this.logger.info('Using incremental update')
          // Cache the fresh icons for next time
          await this.cacheManager.cacheIcons(cacheKey, fresh)
          // Return only changed icons (for now return all, incremental generation can be optimized later)
          return fresh
        } else {
          this.logger.info('Too many changes, using full update')
          await this.cacheManager.cacheIcons(cacheKey, fresh)
          return fresh
        }
      } catch (error) {
        this.logger.warn('Failed to fetch fresh icons, using cached version')
        return cached
      }
    }

    // No cache, fetch fresh
    try {
      const icons = await plugin.fetch({})
      // Cache the results
      await this.cacheManager.cacheIcons(cacheKey, icons)
      return icons
    } catch (error) {
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
}
