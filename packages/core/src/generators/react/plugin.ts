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

    // Generate individual components
    for (const icon of icons) {
      const componentFile = await this.generateComponent(icon)
      files.push(componentFile)
    }

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
   * Generate component code
   */
  private generateComponentCode(icon: IconMetadata, componentName: string): string {
    const propsSpread = '{...props}'

    // Clean SVG and extract attributes
    const svg = icon.svg
    const viewBox = icon.viewBox || `0 0 ${icon.width} ${icon.height}`

    // Extract SVG content (remove outer <svg> tags)
    const svgContent = svg
      .replace(/<svg[^>]*>/i, '')
      .replace(/<\/svg>/i, '')
      .trim()

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
      fill="none"
      ${propsSpread}
    >
      ${svgContent}
    </svg>
  )
}${this.options.memo ? ')' : ''}

${this.options.typescript ? '' : `${componentName}.displayName = '${componentName}'`}

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
    const exports = icons
      .map(icon => {
        const componentName = this.getComponentName(icon.name)
        return `export { default as ${componentName} } from './${componentName}'`
      })
      .join('\n')

    const code = `// Auto-generated index file
${exports}
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
    const iconNames = icons.map(icon => `  | '${icon.name}'`).join('\n')

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
    return `  '${icon.name}': {
    name: '${icon.name}',
    displayName: '${icon.displayName || icon.name}',
    category: '${icon.category || ''}',
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
