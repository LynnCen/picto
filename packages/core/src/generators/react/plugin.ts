/**
 * React Generator Plugin
 * Generates React/TypeScript icon components
 */

import { join } from 'node:path'
import type { GeneratorPlugin, IconMetadata, GeneratedFile } from '@picto/types'
import { toPascalCase, applyNaming } from '../utils/naming'
import { formatTypeScript } from '../utils/formatter'
import type { Logger } from '../../logger'
import type { NamingConfig } from '../../config'

export interface ReactGeneratorOptions {
  dir: string
  typescript?: boolean
  memo?: boolean
  propTypes?: boolean
  includeTypes?: boolean
  includeIndex?: boolean
  naming?: NamingConfig
}

export class ReactGeneratorPlugin implements GeneratorPlugin {
  name = 'react-generator'
  version = '0.0.1'
  type = 'generator' as const

  private options: ReactGeneratorOptions
  private logger?: Logger

  constructor(options: ReactGeneratorOptions, logger?: Logger) {
    this.options = {
      typescript: true,
      memo: true,
      propTypes: false,
      includeTypes: true,
      includeIndex: true,
      ...options,
    }
    this.logger = logger
  }

  /**
   * Generate React components
   */
  async generate(
    icons: IconMetadata[],
    _options: Record<string, unknown> = {}
  ): Promise<GeneratedFile[]> {
    this.logger?.info(`Generating React components for ${icons.length} icon(s)...`)

    const files: GeneratedFile[] = []

    // Generate individual components in parallel for better performance
    const componentPromises = icons.map(icon => this.generateComponent(icon))
    const componentFiles = await Promise.all(componentPromises)
    files.push(...componentFiles)

    // Generate index file
    if (this.options.includeIndex) {
      const indexFile = await this.generateIndex(icons)
      files.push(indexFile)
    }

    // Generate types file
    if (this.options.includeTypes && this.options.typescript) {
      const typesFile = await this.generateTypes(icons)
      files.push(typesFile)
    }

    this.logger?.success(`Generated ${files.length} file(s)`)
    return files
  }

  /**
   * Generate a single React component
   */
  private async generateComponent(icon: IconMetadata): Promise<GeneratedFile> {
    const componentName = this.getComponentName(icon.name)
    const ext = this.options.typescript ? '.tsx' : '.jsx'
    const fileName = `${componentName}${ext}`

    const code = this.generateComponentCode(icon, componentName)
    const formatted = await formatTypeScript(code)

    return {
      path: join(this.options.dir, fileName),
      content: formatted,
    }
  }

  /**
   * Convert kebab-case to camelCase
   * Examples: stroke-width -> strokeWidth, data-v-123abc -> dataV123abc
   */
  private kebabToCamel(str: string): string {
    return str.replace(/-([\da-z])/gi, (_: string, char: string) => char.toUpperCase())
  }

  /**
   * Escape string for safe use in generated code
   */
  private escapeString(str: string): string {
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '\\r')
  }

  /**
   * Extract SVG root attributes from original SVG string
   */
  private extractSvgAttributes(svg: string): { fill?: string; stroke?: string } {
    const attrs: { fill?: string; stroke?: string } = {}

    // Extract fill attribute from <svg> tag
    const fillMatch = svg.match(/<svg[^>]*\sfill=["']([^"']+)["']/i)
    if (fillMatch?.[1] && fillMatch[1] !== 'none') {
      attrs.fill = fillMatch[1]
    }

    // Extract stroke attribute from <svg> tag
    const strokeMatch = svg.match(/<svg[^>]*\sstroke=["']([^"']+)["']/i)
    if (strokeMatch?.[1]) {
      attrs.stroke = strokeMatch[1]
    }

    return attrs
  }

  /**
   * Remove Figma-specific data attributes
   * Removes all data-figma-* attributes as they are metadata and not needed in React
   */
  private removeFigmaAttributes(svgContent: string): string {
    // Remove data-figma-* attributes (e.g., data-figma-bg-blur-radius, data-figma-gradient-fill)
    return svgContent.replace(/\s+data-figma-[a-z-]+="[^"]*"/gi, '')
  }

  /**
   * Transform XML namespace attributes to JSX format
   * - xlink:href -> xlinkHref
   * - xmlns:xlink -> xmlnsXlink
   * - xml:space -> xmlSpace
   */
  private transformXMLNamespaces(svgContent: string): string {
    return svgContent
      .replace(/\sxlink:href=/g, ' xlinkHref=')
      .replace(/\sxmlns:xlink=/g, ' xmlnsXlink=')
      .replace(/\sxml:space=/g, ' xmlSpace=')
  }

  /**
   * Transform CSS style string to React style object
   * - Converts "style='prop:value;prop:value'" to "style={{prop: 'value', prop: 'value'}}"
   * - Converts kebab-case CSS properties to camelCase
   */

  private transformStyleAttribute(svgContent: string): string {
    return svgContent.replace(
      /\sstyle=(["'])([^"']+)\1/gi,
      (_match: string, _quote: string, styleStr: string) => {
        // Parse CSS string into key-value pairs
        const styles = styleStr
          .split(';')
          .map((s: string) => s.trim())
          .filter((s: string) => s.includes(':'))
          .map((s: string) => {
            const [key, ...valueParts] = s.split(':')
            if (!key) {
              return ''
            }
            const value = valueParts.join(':').trim() // Rejoin in case value contains ':'
            const camelKey = this.kebabToCamel(key.trim())
            // Escape single quotes in value and wrap in quotes
            const escapedValue = value.replace(/'/g, "\\'")
            return `${camelKey}: '${escapedValue}'`
          })
          .filter((s: string) => s.length > 0) // Remove empty entries

        if (styles.length === 0) {
          return '' // Remove empty style attribute
        }

        // Build React style object syntax
        return ` style={{${styles.join(', ')}}}`
      }
    )
  }

  /**
   * Transform SVG attributes to JSX format
   * - Removes Figma metadata attributes
   * - Converts XML namespaces (xlink:href -> xlinkHref)
   * - Converts style string to React style object
   * - Converts kebab-case to camelCase (stroke-width -> strokeWidth)
   * - Converts numeric values to JSX expressions (="1.8" -> ={1.8})
   */

  private transformSVGToJSX(svgContent: string): string {
    // Step 1: Remove Figma-specific attributes
    let result = this.removeFigmaAttributes(svgContent)

    // Step 2: Transform XML namespace attributes
    result = this.transformXMLNamespaces(result)

    // Step 3: Transform style attribute to React style object (must be before kebab-case transformation)
    result = this.transformStyleAttribute(result)

    // Step 4: Transform kebab-case attributes to camelCase
    result = result.replace(
      /\s([a-z]+(?:-[a-z]+)+)=["']([^"']+)["']/gi,
      (_match: string, attrName: string, attrValue: string) => {
        const camelAttr = this.kebabToCamel(attrName)

        // If value is a pure number, convert to JSX expression
        if (/^\d+(\.\d+)?$/.test(attrValue)) {
          return ` ${camelAttr}={${attrValue}}`
        }

        // Otherwise keep as string
        return ` ${camelAttr}="${attrValue}"`
      }
    )

    return result
  }

  /**
   * Generate component code
   */
  private generateComponentCode(icon: IconMetadata, componentName: string): string {
    const propsSpread = '{...props}'

    // Clean SVG and extract attributes
    const svg = icon.svg
    const viewBox = icon.viewBox || `0 0 ${icon.width} ${icon.height}`

    // Extract original SVG attributes
    const svgAttrs = this.extractSvgAttributes(svg)
    const fillAttr = svgAttrs.fill ? `fill="${svgAttrs.fill}"` : 'fill="none"'
    const strokeAttr = svgAttrs.stroke ? `stroke="${svgAttrs.stroke}"` : ''

    // Extract SVG content (remove outer <svg> tags)
    const svgContent = svg
      .replace(/<svg[^>]*>/i, '')
      .replace(/<\/svg>/i, '')
      .trim()

    // Transform SVG attributes to JSX format
    const jsxContent = this.transformSVGToJSX(svgContent)

    const componentCode = `
import React from 'react'

${this.options.typescript ? `export interface ${componentName}Props extends React.SVGProps<SVGSVGElement> {}` : ''}

${this.generateComponentDoc(icon)}
export ${this.options.memo ? 'const' : 'function'} ${componentName} = ${this.options.memo ? 'React.memo(' : ''}${this.options.typescript ? `(props: ${componentName}Props)` : '(props)'} => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="${icon.width}"
      height="${icon.height}"
      viewBox="${viewBox}"
      ${fillAttr}
      ${strokeAttr}
      ${propsSpread}
    >
      ${jsxContent}
    </svg>
  )
}${this.options.memo ? ')' : ''}

${this.options.memo ? `${componentName}.displayName = '${componentName}'` : this.options.typescript ? '' : `${componentName}.displayName = '${componentName}'`}

export default ${componentName}
`

    return componentCode
  }

  /**
   * Generate component documentation
   */
  private generateComponentDoc(icon: IconMetadata): string {
    const lines: string[] = ['/**']

    if (icon.displayName) {
      lines.push(` * ${icon.displayName}`)
    }

    if (icon.description) {
      lines.push(` * ${icon.description}`)
    }

    if (icon.category) {
      lines.push(` * @category ${icon.category}`)
    }

    lines.push(` * @source ${icon.source.type}`)
    lines.push(' */')

    return lines.join('\n')
  }

  /**
   * Generate index file
   */
  private async generateIndex(icons: IconMetadata[]): Promise<GeneratedFile> {
    const ext = this.options.typescript ? '.ts' : '.js'

    // Build component name map to avoid duplicate calls and detect duplicates
    const componentNameMap = new Map<string, string>()
    const seen = new Set<string>()

    for (const icon of icons) {
      const componentName = this.getComponentName(icon.name)
      if (seen.has(componentName)) {
        this.logger?.warn(`Duplicate component name detected: ${componentName}, skipping duplicate`)
        continue
      }
      seen.add(componentName)
      componentNameMap.set(icon.name, componentName)
    }

    // Generate exports using the cached component names
    const uniqueExports = Array.from(componentNameMap.values())
      .map(componentName => {
        return `export { default as ${componentName} } from './${componentName}'`
      })
      .join('\n')

    const code = `// Auto-generated index file
${uniqueExports}
`

    const formatted = await formatTypeScript(code)

    return {
      path: join(this.options.dir, `index${ext}`),
      content: formatted,
    }
  }

  /**
   * Generate types file
   */
  private async generateTypes(icons: IconMetadata[]): Promise<GeneratedFile> {
    // Handle empty icons array
    if (icons.length === 0) {
      const code = `// Auto-generated types
export type IconName = never

export interface IconMetadata {
  name: IconName
  displayName?: string
  category?: string
  width: number
  height: number
  tags?: string[]
}

export const iconMetadata: Record<string, never> = {}
`
      const formatted = await formatTypeScript(code)
      return {
        path: join(this.options.dir, 'types.ts'),
        content: formatted,
      }
    }

    // Escape icon names for safe use in type definitions
    const iconNames = icons.map(icon => `  | '${this.escapeString(icon.name)}'`).join('\n')

    const code = `// Auto-generated types
export type IconName =
${iconNames}

export interface IconMetadata {
  name: IconName
  displayName?: string
  category?: string
  width: number
  height: number
  tags?: string[]
}

export const iconMetadata: Record<IconName, IconMetadata> = {
${icons
  .map(icon => {
    return `  '${this.escapeString(icon.name)}': {
    name: '${this.escapeString(icon.name)}',
    displayName: '${this.escapeString(icon.displayName || icon.name)}',
    category: '${this.escapeString(icon.category || '')}',
    width: ${icon.width},
    height: ${icon.height},
    tags: ${JSON.stringify(icon.tags || [])},
  },`
  })
  .join('\n')}
}
`

    const formatted = await formatTypeScript(code)

    return {
      path: join(this.options.dir, 'types.ts'),
      content: formatted,
    }
  }

  /**
   * Get component name for icon
   */
  private getComponentName(iconName: string): string {
    const transformed = applyNaming(iconName, {
      case: 'pascal',
      ...this.options.naming,
    })

    return toPascalCase(transformed)
  }
}
