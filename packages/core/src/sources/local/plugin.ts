/**
 * Local SVG Source Plugin
 * Scans local directory for SVG files
 */

import { readFile } from 'node:fs/promises'
import { resolve, relative, parse, dirname } from 'node:path'
import { glob } from 'fast-glob'
import type { SourcePlugin, IconMetadata } from '@picto/types'
import type { Logger } from '../../logger'
import type { LocalSourceConfig } from '../../config'
import type { LocalFile } from './types'

export interface LocalPluginOptions extends Omit<LocalSourceConfig, 'type'> {
  logger?: Logger
  cwd?: string
}

export class LocalSourcePlugin implements SourcePlugin {
  name = 'local-source'
  version = '0.0.1'
  type = 'source' as const

  private options: LocalPluginOptions
  private logger?: Logger
  private cwd: string

  constructor(options: LocalPluginOptions) {
    this.options = options
    this.logger = options.logger
    this.cwd = options.cwd || process.cwd()
  }

  /**
   * Fetch icons from local directory
   */
  async fetch(_fetchOptions: Record<string, unknown> = {}): Promise<IconMetadata[]> {
    this.logger?.info('Scanning local directory for SVG files...')

    try {
      // Scan for SVG files
      const files = await this.scanDirectory()

      if (files.length === 0) {
        this.logger?.warn(`No SVG files found in: ${this.options.dir}`)
        return []
      }

      this.logger?.success(`Found ${files.length} SVG file(s)`)

      // Read and parse SVG files
      const svgFiles = await this.readSVGFiles(files)

      // Apply filters
      const filteredFiles = this.applyFilters(svgFiles)

      // Transform to IconMetadata
      const metadata = this.transformToMetadata(filteredFiles)

      this.logger?.success(`Successfully processed ${metadata.length} icon(s) from local directory`)
      return metadata
    } catch (error) {
      this.logger?.error('Failed to scan local directory')
      throw error
    }
  }

  /**
   * Scan directory for SVG files
   */
  private async scanDirectory(): Promise<string[]> {
    const baseDir = resolve(this.cwd, this.options.dir)
    const pattern = this.options.pattern || '**/*.svg'

    this.logger?.debug(`Scanning directory: ${baseDir}`)
    this.logger?.debug(`Pattern: ${pattern}`)

    try {
      const files = await glob(pattern, {
        cwd: baseDir,
        absolute: true,
        onlyFiles: true,
        ignore: ['**/node_modules/**', '**/.git/**'],
      })

      return files
    } catch (error) {
      this.logger?.error(`Failed to scan directory: ${baseDir}`)
      throw error
    }
  }

  /**
   * Read SVG file contents
   */
  private async readSVGFiles(filePaths: string[]): Promise<LocalFile[]> {
    this.logger?.info(`Reading ${filePaths.length} SVG file(s)...`)

    const results: LocalFile[] = []
    const baseDir = resolve(this.cwd, this.options.dir)

    for (const filePath of filePaths) {
      try {
        const content = await readFile(filePath, 'utf-8')
        const relativePath = relative(baseDir, filePath)
        const parsedPath = parse(relativePath)
        const category = this.extractCategory(relativePath)

        results.push({
          path: filePath,
          name: parsedPath.name,
          category,
          content,
        })
      } catch (error) {
        this.logger?.warn(`Failed to read file: ${filePath}`)
      }
    }

    return results
  }

  /**
   * Extract category from file path
   */
  private extractCategory(relativePath: string): string | undefined {
    const dir = dirname(relativePath)

    // If file is in subdirectory, use directory name as category
    if (dir && dir !== '.' && dir !== '/') {
      // Use the first directory level as category
      const parts = dir.split(/[/\\]/)
      return parts[0]
    }

    return undefined
  }

  /**
   * Extract description from SVG comments
   */
  private extractDescription(svg: string): string | undefined {
    // Look for description in SVG comments
    const commentMatch = svg.match(/<!--\s*([^-]+?)\s*-->/)
    if (commentMatch && commentMatch[1]) {
      return commentMatch[1].trim()
    }

    // Look for <desc> tag
    const descMatch = svg.match(/<desc>([^<]+)<\/desc>/)
    if (descMatch && descMatch[1]) {
      return descMatch[1].trim()
    }

    return undefined
  }

  /**
   * Apply filters to files
   */
  private applyFilters(files: LocalFile[]): LocalFile[] {
    if (!this.options.filters) {
      return files
    }

    let filtered = [...files]

    // Name pattern filter
    if (this.options.filters.namePattern) {
      const pattern =
        typeof this.options.filters.namePattern === 'string'
          ? new RegExp(this.options.filters.namePattern)
          : this.options.filters.namePattern

      filtered = filtered.filter(file => pattern.test(file.name))
    }

    return filtered
  }

  /**
   * Transform local files to IconMetadata
   */
  private transformToMetadata(files: LocalFile[]): IconMetadata[] {
    return files.map(file => {
      const description = this.extractDescription(file.content)
      const { width, height, viewBox } = this.extractDimensions(file.content)
      const colors = this.extractColors(file.content)
      const hash = this.generateHash(file.content)

      return {
        id: file.name,
        name: file.name,
        displayName: file.name,
        description,
        category: file.category,
        svg: this.cleanSVG(file.content),
        width,
        height,
        viewBox,
        source: {
          type: 'local',
          url: file.path,
        },
        colors,
        generatedAt: new Date(),
        hash,
      }
    })
  }

  /**
   * Extract dimensions from SVG
   */
  private extractDimensions(
    svg: string
  ): { width: number; height: number; viewBox?: string } {
    // Extract viewBox
    const viewBoxMatch = svg.match(/viewBox=["']([^"']+)["']/)
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : undefined

    // Try to get from width/height attributes
    const widthMatch = svg.match(/width=["']([^"']+)["']/)
    const heightMatch = svg.match(/height=["']([^"']+)["']/)

    if (widthMatch && widthMatch[1] && heightMatch && heightMatch[1]) {
      return {
        width: parseFloat(widthMatch[1]),
        height: parseFloat(heightMatch[1]),
        viewBox,
      }
    }

    // Try to get from viewBox
    if (viewBox) {
      const parts = viewBox.split(/\s+/)
      if (parts.length === 4 && parts[2] && parts[3]) {
        return {
          width: parseFloat(parts[2]),
          height: parseFloat(parts[3]),
          viewBox,
        }
      }
    }

    // Default dimensions
    return { width: 24, height: 24, viewBox }
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
        if (color !== '#000000' && color !== '#000') {
          colors.add(color.toLowerCase())
        }
      })
    }

    return Array.from(colors)
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
        // Remove unnecessary whitespace
        .replace(/\s+/g, ' ')
        .replace(/>\s+</g, '><')
    )
  }

  /**
   * Generate hash for SVG content
   */
  private generateHash(svg: string): string {
    let hash = 0
    for (let i = 0; i < svg.length; i++) {
      const char = svg.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Setup hook (optional)
   */
  setup(): void {
    this.logger?.debug('Local source plugin setup complete')
  }

  /**
   * Teardown hook (optional)
   */
  teardown(): void {
    this.logger?.debug('Local source plugin teardown complete')
  }
}
