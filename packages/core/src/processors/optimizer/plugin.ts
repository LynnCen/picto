/**
 * SVG Optimizer Processor Plugin
 * Optimizes SVG content using SVGO
 */

import { optimize, type Config as SvgoConfig } from 'svgo'
import type { ProcessorPlugin, IconMetadata } from '@picto/types'
import type { Logger } from '../../logger'

export interface OptimizerOptions {
  enabled?: boolean
  svgoConfig?: SvgoConfig
  logger?: Logger
}

export class OptimizerPlugin implements ProcessorPlugin {
  name = 'svg-optimizer'
  version = '0.0.1'
  type = 'processor' as const

  private options: OptimizerOptions
  private logger?: Logger

  constructor(options: OptimizerOptions = {}) {
    this.options = {
      enabled: true,
      ...options,
    }
    this.logger = options.logger
  }

  /**
   * Process icon by optimizing SVG
   */
  process(
    icon: IconMetadata,
    _processOptions: Record<string, unknown> = {}
  ): Promise<IconMetadata> {
    if (!this.options.enabled) {
      return Promise.resolve(icon)
    }

    try {
      const optimized = this.optimizeSVG(icon.svg)

      return Promise.resolve({
        ...icon,
        svg: optimized,
      })
    } catch (error) {
      this.logger?.warn(`Failed to optimize icon: ${icon.name}`, error)
      return Promise.resolve(icon) // Return original on error
    }
  }

  /**
   * Optimize SVG using SVGO
   */
  private optimizeSVG(svgContent: string): string {
    try {
      const result = optimize(svgContent, {
        ...this.options.svgoConfig,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                // Don't remove viewBox
                removeViewBox: false,
                // Keep IDs for proper references
                cleanupIds: false,
              },
            },
          },
          // Add custom plugins if provided
          ...(this.options.svgoConfig?.plugins || []),
        ],
      })

      if ('data' in result) {
        return result.data
      }

      return svgContent
    } catch (error) {
      this.logger?.error('SVGO optimization failed:', error)
      return svgContent
    }
  }

  /**
   * Setup hook (optional)
   */
  setup(): void {
    this.logger?.debug('SVG optimizer plugin setup complete')
  }

  /**
   * Teardown hook (optional)
   */
  teardown(): void {
    this.logger?.debug('SVG optimizer plugin teardown complete')
  }
}
