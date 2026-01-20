/**
 * Picto Engine
 * Core orchestration engine for icon processing
 */

import type { Config } from '../config'
import type { IconMetadata } from '@picto/types'
import { PluginManager } from '../plugins/manager'
import { Logger } from '../logger'
import { FigmaSourcePlugin } from '../sources/figma'
import { ReactGeneratorPlugin } from '../generators/react'
import { VueGeneratorPlugin } from '../generators/vue'
import { SVGGeneratorPlugin } from '../generators/svg'
import type { GeneratedFile } from '@picto/types'

export interface EngineOptions {
  config: Config
  logger?: Logger
}

export class PictoEngine {
  private config: Config
  private logger: Logger
  private pluginManager: PluginManager

  constructor(options: EngineOptions) {
    this.config = options.config
    this.logger = options.logger || new Logger()
    this.pluginManager = new PluginManager(this.logger)
  }

  /**
   * Initialize the engine
   */
  async initialize(): Promise<void> {
    this.logger.info('Initializing Picto Engine...')

    // Register built-in source plugins
    for (const sourceConfig of this.config.sources) {
      if (sourceConfig.type === 'figma') {
        const plugin = new FigmaSourcePlugin({
          ...sourceConfig,
          logger: this.logger,
        })
        this.pluginManager.register(plugin)
      }
      // TODO: Add more source plugins (Iconfont, Local, etc.)
    }

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

    try {
      return await plugin.fetch({})
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
