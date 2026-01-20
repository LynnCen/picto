/**
 * Figma Data Transformer
 * Converts Figma data to IconMetadata format
 */

import type { IconMetadata } from '@picto/types'
import type { ParsedIcon } from './parser'
import type { Logger } from '../../logger'

export class FigmaTransformer {
  private logger?: Logger
  private fileKey: string
  private fileUrl: string

  constructor(fileKey: string, fileUrl: string, logger?: Logger) {
    this.fileKey = fileKey
    this.fileUrl = fileUrl
    this.logger = logger
  }

  /**
   * Transform parsed icons to IconMetadata format
   */
  transform(icons: ParsedIcon[], svgMap: Map<string, string>): IconMetadata[] {
    this.logger?.info('Transforming icon data...')

    const result: IconMetadata[] = []

    for (const icon of icons) {
      const svg = svgMap.get(icon.id)
      if (!svg) {
        this.logger?.warn(`No SVG content for icon: ${icon.name}`)
        continue
      }

      const metadata = this.transformIcon(icon, svg)
      result.push(metadata)
    }

    this.logger?.success(`Transformed ${result.length} icon(s)`)
    return result
  }

  /**
   * Transform a single icon
   */
  private transformIcon(icon: ParsedIcon, svg: string): IconMetadata {
    // Extract viewBox from SVG
    const viewBox = this.extractViewBox(svg)

    // Extract colors from SVG
    const colors = this.extractColors(svg)

    // Generate hash for caching
    const hash = this.generateHash(svg)

    return {
      id: icon.id,
      name: icon.name,
      displayName: icon.displayName,
      description: icon.description,
      category: icon.category,
      tags: this.generateTags(icon),
      variants: icon.variants?.map(v => ({
        name: v.name,
        type: 'custom',
        value: v.value,
      })),
      svg: this.cleanSVG(svg),
      width: icon.width,
      height: icon.height,
      viewBox,
      source: {
        type: 'figma',
        url: this.fileUrl,
        nodeId: icon.id,
        fileKey: this.fileKey,
        lastSynced: new Date(),
        metadata: {
          componentKey: icon.componentKey,
        },
      },
      colors,
      generatedAt: new Date(),
      hash,
    }
  }

  /**
   * Extract viewBox attribute from SVG
   */
  private extractViewBox(svg: string): string | undefined {
    const match = svg.match(/viewBox=["']([^"']+)["']/)
    return match ? match[1] : undefined
  }

  /**
   * Extract colors from SVG
   */
  private extractColors(svg: string): string[] {
    const colors = new Set<string>()
    const colorRegex = /#[0-9A-Fa-f]{3,8}|rgb\([^)]+\)|rgba\([^)]+\)/g
    const matches = svg.match(colorRegex)

    if (matches) {
      matches.forEach(color => {
        // Normalize color format
        const normalized = this.normalizeColor(color)
        if (normalized && normalized !== '#000000' && normalized !== '#000') {
          colors.add(normalized)
        }
      })
    }

    return Array.from(colors)
  }

  /**
   * Normalize color format
   */
  private normalizeColor(color: string): string | null {
    if (color.startsWith('#')) {
      return color.toLowerCase()
    }

    // Convert rgb/rgba to hex (simplified)
    if (color.startsWith('rgb')) {
      const match = color.match(/\d+/g)
      if (match && match.length >= 3) {
        const r = parseInt(match[0] || '0')
        const g = parseInt(match[1] || '0')
        const b = parseInt(match[2] || '0')
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
      }
    }

    return null
  }

  /**
   * Generate tags from icon metadata
   */
  private generateTags(icon: ParsedIcon): string[] {
    const tags: string[] = []

    // Add category as tag
    if (icon.category) {
      tags.push(icon.category.toLowerCase())
    }

    // Add name parts as tags
    const nameParts = icon.name.split('-').filter(part => part.length > 2)
    tags.push(...nameParts)

    // Remove duplicates
    return Array.from(new Set(tags))
  }

  /**
   * Clean SVG content
   */
  private cleanSVG(svg: string): string {
    return (
      svg
        .trim()
        // Remove XML declaration
        .replace(/<\?xml[^?]*\?>\s*/i, '')
        // Remove comments
        .replace(/<!--[\s\S]*?-->/g, '')
        // Remove unnecessary whitespace
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
    )
  }

  /**
   * Generate hash for SVG content
   */
  private generateHash(svg: string): string {
    // Simple hash function (in production, use crypto.createHash)
    let hash = 0
    for (let i = 0; i < svg.length; i++) {
      const char = svg.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }
}
