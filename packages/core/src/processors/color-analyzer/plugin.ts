/**
 * Color Analyzer Processor Plugin
 * Analyzes SVG colors and determines color characteristics
 */

import type { ProcessorPlugin, IconMetadata } from '@picto/types'
import type { Logger } from '../../logger'

export interface ColorAnalyzerOptions {
  enabled?: boolean
  extractColors?: boolean
  detectColorType?: boolean
  logger?: Logger
}

export type ColorType = 'monochrome' | 'duotone' | 'multicolor' | 'none'

export interface ColorAnalysisResult {
  colors: string[]
  colorType: ColorType
  isConfigurable: boolean
  palette?: string[]
}

export class ColorAnalyzerPlugin implements ProcessorPlugin {
  name = 'color-analyzer'
  version = '0.0.1'
  type = 'processor' as const

  private options: ColorAnalyzerOptions
  private logger?: Logger

  constructor(options: ColorAnalyzerOptions = {}) {
    this.options = {
      enabled: true,
      extractColors: true,
      detectColorType: true,
      ...options,
    }
    this.logger = options.logger
  }

  /**
   * Process icon by analyzing colors
   */
  process(
    icon: IconMetadata,
    _processOptions: Record<string, unknown> = {}
  ): Promise<IconMetadata> {
    if (!this.options.enabled) {
      return Promise.resolve(icon)
    }

    try {
      const analysis = this.analyzeColors(icon.svg)

      // Add analysis results to icon source metadata
      return Promise.resolve({
        ...icon,
        colors: analysis.colors,
        source: {
          ...icon.source,
          metadata: {
            ...icon.source.metadata,
            colorType: analysis.colorType,
            isConfigurable: analysis.isConfigurable,
            palette: analysis.palette,
          },
        },
      })
    } catch (error) {
      this.logger?.warn(`Failed to analyze colors for icon: ${icon.name}`, error)
      return Promise.resolve(icon)
    }
  }

  /**
   * Analyze SVG colors
   */
  private analyzeColors(svgContent: string): ColorAnalysisResult {
    // Extract all colors from SVG
    const colors = this.extractColors(svgContent)

    // Filter out black (default color)
    const significantColors = colors.filter(
      color => color !== '#000000' && color !== '#000' && color !== 'currentColor'
    )

    // Determine color type
    const colorType = this.detectColorType(significantColors)

    // Determine if colors are configurable
    const isConfigurable = this.isColorConfigurable(svgContent, colorType)

    // Generate color palette
    const palette = this.generatePalette(significantColors)

    return {
      colors: significantColors,
      colorType,
      isConfigurable,
      palette,
    }
  }

  /**
   * Extract colors from SVG content
   */
  private extractColors(svg: string): string[] {
    const colors = new Set<string>()

    // Extract fill colors
    const fillMatches = svg.matchAll(/fill\s*=\s*["']([^"']+)["']/g)
    for (const match of fillMatches) {
      const color = match[1]
      if (color && color !== 'none') {
        colors.add(this.normalizeColor(color))
      }
    }

    // Extract stroke colors
    const strokeMatches = svg.matchAll(/stroke\s*=\s*["']([^"']+)["']/g)
    for (const match of strokeMatches) {
      const color = match[1]
      if (color && color !== 'none') {
        colors.add(this.normalizeColor(color))
      }
    }

    // Extract colors from style attributes
    const styleColorMatches = svg.matchAll(
      /(?:fill|stroke)\s*:\s*([^;}"'\s]+)/g
    )
    for (const match of styleColorMatches) {
      const color = match[1]
      if (color && color !== 'none') {
        colors.add(this.normalizeColor(color))
      }
    }

    return Array.from(colors)
  }

  /**
   * Normalize color to consistent format
   */
  private normalizeColor(color: string): string {
    color = color.trim().toLowerCase()

    // If it's currentColor, return as-is
    if (color === 'currentcolor') {
      return 'currentColor'
    }

    // If it's a hex color
    if (color.startsWith('#')) {
      // Expand 3-digit hex to 6-digit
      if (color.length === 4) {
        return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
      }
      return color
    }

    // If it's rgb/rgba, convert to hex
    if (color.startsWith('rgb')) {
      return this.rgbToHex(color)
    }

    return color
  }

  /**
   * Convert RGB to hex
   */
  private rgbToHex(rgb: string): string {
    const match = rgb.match(/\d+/g)
    if (match && match.length >= 3) {
      const r = parseInt(match[0] || '0')
      const g = parseInt(match[1] || '0')
      const b = parseInt(match[2] || '0')
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
    }
    return rgb
  }

  /**
   * Detect color type
   */
  private detectColorType(colors: string[]): ColorType {
    if (colors.length === 0) {
      return 'none'
    }

    if (colors.length === 1) {
      return 'monochrome'
    }

    if (colors.length === 2) {
      return 'duotone'
    }

    return 'multicolor'
  }

  /**
   * Determine if colors are configurable (using currentColor)
   */
  private isColorConfigurable(svg: string, colorType: ColorType): boolean {
    // If uses currentColor, it's configurable
    if (svg.includes('currentColor')) {
      return true
    }

    // If monochrome and simple structure, likely configurable
    if (colorType === 'monochrome') {
      return true
    }

    return false
  }

  /**
   * Generate color palette
   */
  private generatePalette(colors: string[]): string[] {
    // Return unique colors, sorted
    return Array.from(new Set(colors)).sort()
  }

  /**
   * Setup hook (optional)
   */
  setup(): void {
    this.logger?.debug('Color analyzer plugin setup complete')
  }

  /**
   * Teardown hook (optional)
   */
  teardown(): void {
    this.logger?.debug('Color analyzer plugin teardown complete')
  }
}
