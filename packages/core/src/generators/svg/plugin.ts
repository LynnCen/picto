/**
 * SVG Generator Plugin
 * Generates optimized SVG files and JSON metadata
 */

import { join } from 'node:path'
import type { GeneratorPlugin, IconMetadata, GeneratedFile } from '@picto/types'
import { toKebabCase, applyNaming } from '../utils/naming'
import { formatJSON } from '../utils/formatter'
import type { Logger } from '../../logger'
import type { NamingConfig } from '../../config'

export interface SVGGeneratorOptions {
  dir: string
  generateJSON?: boolean
  generateManifest?: boolean
  naming?: NamingConfig
}

export class SVGGeneratorPlugin implements GeneratorPlugin {
  name = 'svg-generator'
  version = '0.0.1'
  type = 'generator' as const

  private options: SVGGeneratorOptions
  private logger?: Logger

  constructor(options: SVGGeneratorOptions, logger?: Logger) {
    this.options = {
      generateJSON: true,
      generateManifest: true,
      ...options,
    }
    this.logger = logger
  }

  /**
   * Generate SVG files and metadata
   */
  async generate(
    icons: IconMetadata[],
    _options: Record<string, unknown> = {}
  ): Promise<GeneratedFile[]> {
    this.logger?.info(`Generating SVG files for ${icons.length} icon(s)...`)

    const files: GeneratedFile[] = []

    // Generate individual SVG files
    for (const icon of icons) {
      const svgFile = this.generateSVG(icon)
      files.push(svgFile)
    }

    // Generate JSON index
    if (this.options.generateJSON) {
      const jsonFile = await this.generateJSON(icons)
      files.push(jsonFile)
    }

    // Generate manifest
    if (this.options.generateManifest) {
      const manifestFile = await this.generateManifest(icons)
      files.push(manifestFile)
    }

    this.logger?.success(`Generated ${files.length} file(s)`)
    return files
  }

  /**
   * Generate a single SVG file
   */
  private generateSVG(icon: IconMetadata): GeneratedFile {
    const fileName = this.getFileName(icon.name)
    const svg = this.optimizeSVG(icon)

    return {
      path: join(this.options.dir, `${fileName}.svg`),
      content: svg,
    }
  }

  /**
   * Generate JSON index file (Iconify format)
   */
  private async generateJSON(icons: IconMetadata[]): Promise<GeneratedFile> {
    const iconifyData = {
      prefix: 'picto',
      icons: {} as Record<string, { body: string; width?: number; height?: number }>,
      width: 24,
      height: 24,
    }

    for (const icon of icons) {
      const body = icon.svg
        .replace(/<svg[^>]*>/i, '')
        .replace(/<\/svg>/i, '')
        .trim()

      iconifyData.icons[icon.name] = {
        body,
        width: icon.width !== 24 ? icon.width : undefined,
        height: icon.height !== 24 ? icon.height : undefined,
      }
    }

    const formatted = await formatJSON(iconifyData)

    return {
      path: join(this.options.dir, 'icons.json'),
      content: formatted,
    }
  }

  /**
   * Generate manifest file
   */
  private async generateManifest(icons: IconMetadata[]): Promise<GeneratedFile> {
    const manifest = {
      name: 'Picto Icons',
      version: '1.0.0',
      icons: icons.map(icon => ({
        name: icon.name,
        displayName: icon.displayName,
        description: icon.description,
        category: icon.category,
        tags: icon.tags,
        width: icon.width,
        height: icon.height,
        colors: icon.colors,
        source: {
          type: icon.source.type,
          url: icon.source.url,
        },
      })),
      categories: this.extractCategories(icons),
      tags: this.extractTags(icons),
    }

    const formatted = await formatJSON(manifest)

    return {
      path: join(this.options.dir, 'manifest.json'),
      content: formatted,
    }
  }

  /**
   * Optimize SVG (basic optimization)
   */
  private optimizeSVG(icon: IconMetadata): string {
    const viewBox = icon.viewBox || `0 0 ${icon.width} ${icon.height}`

    // Extract SVG content
    const content = icon.svg
      .replace(/<svg[^>]*>/i, '')
      .replace(/<\/svg>/i, '')
      .trim()

    // Build optimized SVG
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${icon.width}" height="${icon.height}" viewBox="${viewBox}" fill="none">
  ${content}
</svg>`
  }

  /**
   * Extract unique categories
   */
  private extractCategories(icons: IconMetadata[]): string[] {
    const categories = new Set<string>()
    icons.forEach(icon => {
      if (icon.category) {
        categories.add(icon.category)
      }
    })
    return Array.from(categories).sort()
  }

  /**
   * Extract unique tags
   */
  private extractTags(icons: IconMetadata[]): string[] {
    const tags = new Set<string>()
    icons.forEach(icon => {
      if (icon.tags) {
        icon.tags.forEach(tag => tags.add(tag))
      }
    })
    return Array.from(tags).sort()
  }

  /**
   * Get file name for icon
   */
  private getFileName(iconName: string): string {
    const transformed = applyNaming(iconName, {
      case: 'kebab',
      ...this.options.naming,
    })

    return toKebabCase(transformed)
  }
}
