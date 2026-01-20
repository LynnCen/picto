/**
 * Iconfont Data Transformer
 * Converts Iconfont data to IconMetadata format
 */

import type { IconMetadata } from '@picto/types'
import type { IconfontIcon } from './types'
import type { Logger } from '../../logger'

export class IconfontTransformer {
  private logger?: Logger
  private projectId: string
  private projectUrl: string

  constructor(projectId: string, projectUrl: string, logger?: Logger) {
    this.projectId = projectId
    this.projectUrl = projectUrl
    this.logger = logger
  }

  /**
   * Transform Iconfont icons to IconMetadata format
   */
  transform(icons: Array<{ icon: IconfontIcon; svg: string }>): IconMetadata[] {
    this.logger?.info('Transforming icon data...')

    const result: IconMetadata[] = []

    for (const { icon, svg } of icons) {
      try {
        const metadata = this.transformIcon(icon, svg)
        result.push(metadata)
      } catch (error) {
        this.logger?.warn(`Failed to transform icon: ${icon.name}`, error)
      }
    }

    this.logger?.success(`Transformed ${result.length} icon(s)`)
    return result
  }

  /**
   * Transform a single icon
   */
  private transformIcon(icon: IconfontIcon, svg: string): IconMetadata {
    // Extract viewBox from SVG
    const viewBox = this.extractViewBox(svg)

    // Extract dimensions
    const { width, height } = this.extractDimensions(svg, viewBox)

    // Extract colors from SVG
    const colors = this.extractColors(svg)

    // Generate hash for caching
    const hash = this.generateHash(svg)

    // Generate tags from icon name
    const tags = this.generateTags(icon)

    return {
      id: String(icon.id),
      name: icon.font_class || this.sanitizeName(icon.name),
      displayName: icon.name,
      svg: this.cleanSVG(svg),
      width,
      height,
      viewBox,
      source: {
        type: 'iconfont',
        url: this.projectUrl,
        metadata: {
          projectId: this.projectId,
          fontClass: icon.font_class,
          unicode: icon.unicode,
          unicodeDecimal: icon.unicode_decimal,
        },
      },
      colors,
      tags,
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
   * Extract dimensions from SVG
   */
  private extractDimensions(
    svg: string,
    viewBox?: string
  ): { width: number; height: number } {
    // Try to get from width/height attributes
    const widthMatch = svg.match(/width=["']([^"']+)["']/)
    const heightMatch = svg.match(/height=["']([^"']+)["']/)

    if (widthMatch && widthMatch[1] && heightMatch && heightMatch[1]) {
      return {
        width: parseFloat(widthMatch[1]),
        height: parseFloat(heightMatch[1]),
      }
    }

    // Try to get from viewBox
    if (viewBox) {
      const parts = viewBox.split(/\s+/)
      if (parts.length === 4 && parts[2] && parts[3]) {
        return {
          width: parseFloat(parts[2]),
          height: parseFloat(parts[3]),
        }
      }
    }

    // Default dimensions
    return { width: 24, height: 24 }
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
   * Generate tags from icon data
   */
  private generateTags(icon: IconfontIcon): string[] {
    const tags: string[] = []

    // Add name parts as tags
    const nameParts = icon.name.split(/[-_\s]/).filter(part => part.length > 2)
    tags.push(...nameParts.map(part => part.toLowerCase()))

    // Add font class as tag
    if (icon.font_class) {
      const classParts = icon.font_class.split(/[-_]/).filter(part => part.length > 2)
      tags.push(...classParts.map(part => part.toLowerCase()))
    }

    // Remove duplicates
    return Array.from(new Set(tags))
  }

  /**
   * Sanitize name for use as identifier
   */
  private sanitizeName(name: string): string {
    return name
      .trim()
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
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
    // Simple hash function
    let hash = 0
    for (let i = 0; i < svg.length; i++) {
      const char = svg.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }
}
