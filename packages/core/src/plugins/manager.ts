/**
 * Plugin Manager
 * Manages plugin lifecycle and registration
 */

import type { Plugin, SourcePlugin, ProcessorPlugin, GeneratorPlugin } from '@picto/types'
import type { Logger } from '../logger'

export class PluginManager {
  private sourcePlugins = new Map<string, SourcePlugin>()
  private processorPlugins = new Map<string, ProcessorPlugin>()
  private generatorPlugins = new Map<string, GeneratorPlugin>()
  private logger: Logger

  constructor(logger: Logger) {
    this.logger = logger
  }

  /**
   * Register a plugin
   */
  register(plugin: Plugin): void {
    this.logger.debug(`Registering plugin: ${plugin.name} (${plugin.type})`)

    if (plugin.type === 'source') {
      this.sourcePlugins.set(plugin.name, plugin as SourcePlugin)
    } else if (plugin.type === 'processor') {
      this.processorPlugins.set(plugin.name, plugin as ProcessorPlugin)
    } else if (plugin.type === 'generator') {
      this.generatorPlugins.set(plugin.name, plugin as GeneratorPlugin)
    }

    this.logger.success(`Plugin registered: ${plugin.name}`)
  }

  /**
   * Unregister a plugin
   */
  unregister(name: string): void {
    this.sourcePlugins.delete(name)
    this.processorPlugins.delete(name)
    this.generatorPlugins.delete(name)

    this.logger.debug(`Plugin unregistered: ${name}`)
  }

  /**
   * Get a source plugin
   */
  getSourcePlugin(name: string): SourcePlugin | undefined {
    return this.sourcePlugins.get(name)
  }

  /**
   * Get a processor plugin
   */
  getProcessorPlugin(name: string): ProcessorPlugin | undefined {
    return this.processorPlugins.get(name)
  }

  /**
   * Get a generator plugin
   */
  getGeneratorPlugin(name: string): GeneratorPlugin | undefined {
    return this.generatorPlugins.get(name)
  }

  /**
   * Get all source plugins
   */
  getSourcePlugins(): SourcePlugin[] {
    return Array.from(this.sourcePlugins.values())
  }

  /**
   * Get all processor plugins
   */
  getProcessorPlugins(): ProcessorPlugin[] {
    return Array.from(this.processorPlugins.values())
  }

  /**
   * Get all generator plugins
   */
  getGeneratorPlugins(): GeneratorPlugin[] {
    return Array.from(this.generatorPlugins.values())
  }

  /**
   * Initialize all plugins
   */
  async initializeAll(): Promise<void> {
    this.logger.info('Initializing plugins...')

    const allPlugins = [
      ...this.sourcePlugins.values(),
      ...this.processorPlugins.values(),
      ...this.generatorPlugins.values(),
    ]

    for (const plugin of allPlugins) {
      if (plugin.setup) {
        this.logger.debug(`Setting up plugin: ${plugin.name}`)
        await plugin.setup()
      }
    }

    this.logger.success(`Initialized ${allPlugins.length} plugin(s)`)
  }

  /**
   * Teardown all plugins
   */
  async teardownAll(): Promise<void> {
    this.logger.info('Tearing down plugins...')

    const allPlugins = [
      ...this.sourcePlugins.values(),
      ...this.processorPlugins.values(),
      ...this.generatorPlugins.values(),
    ]

    for (const plugin of allPlugins) {
      if (plugin.teardown) {
        this.logger.debug(`Tearing down plugin: ${plugin.name}`)
        await plugin.teardown()
      }
    }

    this.logger.success('All plugins torn down')
  }
}
