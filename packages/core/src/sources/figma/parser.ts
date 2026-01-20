/**
 * Figma Document Tree Parser
 * Extracts icon components from Figma file structure
 */

import type { FigmaNode, FigmaFile, FigmaComponent } from './types'
import type { Logger } from '../../logger'

export interface ParsedIcon {
  id: string
  name: string
  displayName: string
  description?: string
  category?: string
  componentKey?: string
  width: number
  height: number
  variants?: Array<{
    name: string
    value: string
  }>
}

export interface ParserOptions {
  includeComponents?: boolean
  includeComponentSets?: boolean
  includeInstances?: boolean
  namePattern?: RegExp
  categories?: string[]
}

export class FigmaParser {
  private logger?: Logger

  constructor(logger?: Logger) {
    this.logger = logger
  }

  /**
   * Parse Figma file and extract icons
   */
  parseFile(file: FigmaFile, options: ParserOptions = {}): ParsedIcon[] {
    const {
      includeComponents = true,
      includeComponentSets = true,
      includeInstances = false,
    } = options

    this.logger?.info('Parsing Figma file...')

    const icons: ParsedIcon[] = []
    const componentMap = new Map<string, FigmaComponent>()

    // Build component map for quick lookup
    Object.entries(file.components || {}).forEach(([key, component]) => {
      componentMap.set(key, component)
    })

    // Traverse document tree
    this.traverseNode(file.document, node => {
      const icon = this.parseNode(node, componentMap, {
        includeComponents,
        includeComponentSets,
        includeInstances,
      })

      if (icon && this.shouldIncludeIcon(icon, options)) {
        icons.push(icon)
      }
    })

    this.logger?.success(`Found ${icons.length} icon(s)`)
    return icons
  }

  /**
   * Recursively traverse node tree
   */
  private traverseNode(node: FigmaNode, callback: (node: FigmaNode) => void): void {
    callback(node)

    if (node.children) {
      for (const child of node.children) {
        this.traverseNode(child, callback)
      }
    }
  }

  /**
   * Parse a single node into icon data
   */
  private parseNode(
    node: FigmaNode,
    componentMap: Map<string, FigmaComponent>,
    options: {
      includeComponents: boolean
      includeComponentSets: boolean
      includeInstances: boolean
    }
  ): ParsedIcon | null {
    const { includeComponents, includeComponentSets, includeInstances } = options

    // Check if node type is eligible
    if (node.type === 'COMPONENT' && !includeComponents) return null
    if (node.type === 'COMPONENT_SET' && !includeComponentSets) return null
    if (node.type === 'INSTANCE' && !includeInstances) return null

    // Only process certain node types
    if (!['COMPONENT', 'COMPONENT_SET', 'INSTANCE'].includes(node.type)) {
      return null
    }

    // Skip hidden nodes
    if (node.visible === false) {
      return null
    }

    // Get bounding box
    const bbox = node.absoluteBoundingBox
    if (!bbox) {
      this.logger?.warn(`Node ${node.name} has no bounding box, skipping`)
      return null
    }

    // Parse name and extract category
    const { displayName, category } = this.parseName(node.name)

    // Get component metadata
    const component = Array.from(componentMap.values()).find(c => c.key === node.id)

    return {
      id: node.id,
      name: this.sanitizeName(node.name),
      displayName,
      description: node.description || component?.description,
      category,
      componentKey: component?.key,
      width: Math.round(bbox.width),
      height: Math.round(bbox.height),
      variants: this.parseVariants(node),
    }
  }

  /**
   * Parse node name to extract display name and category
   * Supports formats like: "Category/IconName", "icon-name", "IconName"
   */
  private parseName(name: string): { displayName: string; category?: string } {
    // Handle category separator
    if (name.includes('/')) {
      const parts = name.split('/')
      const category = parts.slice(0, -1).join('/')
      const displayName = parts[parts.length - 1] || name
      return { displayName: displayName.trim(), category: category.trim() }
    }

    return { displayName: name.trim() }
  }

  /**
   * Sanitize name for use as identifier
   */
  private sanitizeName(name: string): string {
    return name
      .split('/')
      .pop()!
      .trim()
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase()
  }

  /**
   * Parse variants from component properties
   */
  private parseVariants(node: FigmaNode): Array<{ name: string; value: string }> | undefined {
    if (!node.componentPropertyDefinitions) return undefined

    const variants: Array<{ name: string; value: string }> = []

    Object.entries(node.componentPropertyDefinitions).forEach(([key, value]) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (value && typeof value === 'object' && 'defaultValue' in value) {
        variants.push({
          name: key,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          value: String(value.defaultValue),
        })
      }
    })

    return variants.length > 0 ? variants : undefined
  }

  /**
   * Check if icon should be included based on filters
   */
  private shouldIncludeIcon(icon: ParsedIcon, options: ParserOptions): boolean {
    // Name pattern filter
    if (options.namePattern && !options.namePattern.test(icon.name)) {
      return false
    }

    // Category filter
    if (options.categories && options.categories.length > 0) {
      if (!icon.category || !options.categories.includes(icon.category)) {
        return false
      }
    }

    return true
  }
}
