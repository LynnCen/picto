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
    if (options.categories && options.categories.length > 0) {
      this.logger?.info(`Filtering by categories: ${options.categories.join(', ')}`)
    }

    const icons: ParsedIcon[] = []
    const componentMap = new Map<string, FigmaComponent>()

    // Build component map for quick lookup (use nodeId as key)
    Object.entries(file.components || {}).forEach(([nodeId, component]) => {
      componentMap.set(nodeId, component)
    })

    // Traverse document tree with parent tracking
    this.traverseNode(file.document, [], (node, parents) => {
      const icon = this.parseNode(node, parents, componentMap, {
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
   * Recursively traverse node tree with parent tracking
   */
  private traverseNode(
    node: FigmaNode,
    parents: FigmaNode[],
    callback: (node: FigmaNode, parents: FigmaNode[]) => void
  ): void {
    // Skip nodes that start with . (hidden)
    if (node.name && node.name.startsWith('.')) {
      return
    }

    callback(node, parents)

    if (node.children) {
      for (const child of node.children) {
        // Accumulate parents: current node + previous parents
        this.traverseNode(child, [node, ...parents], callback)
      }
    }
  }

  /**
   * Parse a single node into icon data
   */
  private parseNode(
    node: FigmaNode,
    parents: FigmaNode[],
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

    // Parse name and extract category (with parent information)
    const { displayName, category } = this.parseName(node.name, parents)

    // Get component metadata (use direct lookup by nodeId)
    const component = componentMap.get(node.id)

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
   * Category is the top-level FRAME directly under CANVAS
   */
  private parseName(
    name: string,
    parents: FigmaNode[] = []
  ): { displayName: string; category?: string } {
    // Find the top-level FRAME/GROUP (the one whose parent is CANVAS)
    // Parents array is ordered: [nearest parent, ..., furthest parent]
    // So we search from the end to find the top-level organizational node
    for (let i = parents.length - 1; i >= 0; i--) {
      const parent = parents[i]
      const grandparent = parents[i + 1]

      // Check if this is a top-level FRAME/GROUP under CANVAS
      if (
        (parent?.type === 'FRAME' || parent?.type === 'GROUP') &&
        grandparent?.type === 'CANVAS'
      ) {
        const categoryName = parent.name?.trim()

        // Skip hidden nodes
        if (categoryName && !categoryName.startsWith('.') && !categoryName.startsWith('_')) {
          return {
            displayName: name.trim(),
            category: categoryName,
          }
        }
      }
    }

    // No category found
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
      this.logger?.debug(`Icon "${icon.name}" filtered out by namePattern`)
      return false
    }

    // Category filter
    if (options.categories && options.categories.length > 0) {
      if (!icon.category) {
        this.logger?.debug(`Icon "${icon.name}" has no category, filtered out`)
        return false
      }
      if (!options.categories.includes(icon.category)) {
        this.logger?.debug(
          `Icon "${icon.name}" category "${icon.category}" not in allowed categories [${options.categories.join(', ')}]`
        )
        return false
      }
    }

    return true
  }
}
