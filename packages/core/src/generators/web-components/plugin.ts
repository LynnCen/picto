/**
 * Web Components Generator Plugin
 * Generates standard Web Components from icon metadata
 */

import { join } from 'node:path'
import type { GeneratorPlugin, IconMetadata, GeneratedFile, GeneratorOptions } from '@picto/types'
import type { Logger } from '../../logger'
import { formatTypeScript, formatJavaScript } from '../utils/formatter'
import { applyNaming, toPascalCase, toKebabCase } from '../utils/naming'
import type { NamingConfig } from '../../config'

export interface WebComponentsGeneratorOptions extends GeneratorOptions {
  typescript?: boolean
  shadowDom?: boolean
  prefix?: string
  naming?: NamingConfig
}

export class WebComponentsGeneratorPlugin implements GeneratorPlugin {
  name = 'web-components'
  type = 'generator' as const
  private options: WebComponentsGeneratorOptions
  private logger?: Logger

  constructor(options: WebComponentsGeneratorOptions) {
    this.options = {
      typescript: false,
      shadowDom: true,
      prefix: 'icon',
      ...options,
    }
    this.logger = options.logger as Logger | undefined
  }

  /**
   * Generate Web Components
   */
  async generate(
    icons: IconMetadata[],
    _options: Record<string, unknown> = {}
  ): Promise<GeneratedFile[]> {
    this.logger?.info(`Generating Web Components for ${icons.length} icon(s)...`)

    const generatedFiles: GeneratedFile[] = []

    for (const icon of icons) {
      generatedFiles.push(await this.generateComponent(icon))
    }

    // Generate index file
    generatedFiles.push(await this.generateIndex(icons))

    // Generate types file if TypeScript
    if (this.options.typescript) {
      generatedFiles.push(await this.generateTypes(icons))
    }

    // Generate registry file
    generatedFiles.push(await this.generateRegistry(icons))

    this.logger?.success(`Generated ${generatedFiles.length} Web Component files.`)
    return generatedFiles
  }

  /**
   * Generate a single Web Component file
   */
  private async generateComponent(icon: IconMetadata): Promise<GeneratedFile> {
    const componentName = this.getComponentName(icon.name)
    const tagName = this.getTagName(icon.name)
    const className = toPascalCase(componentName)
    const fileName = `${componentName}.${this.options.typescript ? 'ts' : 'js'}`
    const filePath = join(this.options.dir, fileName)

    const componentCode = this.generateComponentCode(icon, className, tagName)
    const formatted = this.options.typescript
      ? await formatTypeScript(componentCode)
      : await formatJavaScript(componentCode)

    return {
      path: filePath,
      content: formatted,
    }
  }

  /**
   * Generate Web Component code
   */
  private generateComponentCode(icon: IconMetadata, className: string, tagName: string): string {
    const viewBox = icon.viewBox || `0 0 ${icon.width} ${icon.height}`

    // Extract SVG content (remove outer <svg> tags)
    const svgContent = icon.svg.replace(/<svg[^>]*>/i, '').replace(/<\/svg>/i, '').trim()

    const template = this.options.shadowDom
      ? this.generateShadowDomTemplate(svgContent, viewBox, icon)
      : this.generateLightDomTemplate(svgContent, viewBox, icon)

    const code = `
/**
 * ${icon.displayName || icon.name}
 * ${icon.description || ''}
 * @category ${icon.category || 'icons'}
 */
class ${className} extends HTMLElement {
  ${this.options.shadowDom ? 'private shadowRoot: ShadowRoot;' : ''}

  constructor() {
    super();
    ${this.options.shadowDom ? 'this.shadowRoot = this.attachShadow({ mode: "open" });' : ''}
  }

  connectedCallback() {
    this.render();
  }

  static get observedAttributes() {
    return ['width', 'height', 'color'];
  }

  attributeChangedCallback(name${this.options.typescript ? ': string' : ''}, oldValue${this.options.typescript ? ': string | null' : ''}, newValue${this.options.typescript ? ': string | null' : ''}) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  private render() {
    const width = this.getAttribute('width') || '${icon.width}';
    const height = this.getAttribute('height') || '${icon.height}';
    const color = this.getAttribute('color') || 'currentColor';

    ${template}
  }
}

// Register the custom element
if (!customElements.get('${tagName}')) {
  customElements.define('${tagName}', ${className});
}

export default ${className};
`

    return code
  }

  /**
   * Generate Shadow DOM template
   */
  private generateShadowDomTemplate(svgContent: string, viewBox: string, _icon: IconMetadata): string {
    return `
    this.shadowRoot.innerHTML = \`
      <style>
        :host {
          display: inline-block;
          width: \${width}px;
          height: \${height}px;
        }
        svg {
          width: 100%;
          height: 100%;
          fill: \${color};
        }
      </style>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="${viewBox}"
        aria-hidden="true"
      >
        ${svgContent}
      </svg>
    \`;
    `
  }

  /**
   * Generate Light DOM template
   */
  private generateLightDomTemplate(svgContent: string, viewBox: string, _icon: IconMetadata): string {
    return `
    this.innerHTML = \`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="${viewBox}"
        width="\${width}"
        height="\${height}"
        fill="\${color}"
        aria-hidden="true"
      >
        ${svgContent}
      </svg>
    \`;
    `
  }

  /**
   * Generate index file to export all components
   */
  private async generateIndex(icons: IconMetadata[]): Promise<GeneratedFile> {
    const ext = this.options.typescript ? '.ts' : '.js'
    const fileName = `index${ext}`
    const filePath = join(this.options.dir, fileName)

    const exports = icons
      .map(icon => {
        const componentName = this.getComponentName(icon.name)
        const className = toPascalCase(componentName)
        return `export { default as ${className} } from './${componentName}'`
      })
      .join('\n')

    const code = `// Auto-generated by Picto\n\n${exports}\n`
    const formatted = this.options.typescript
      ? await formatTypeScript(code)
      : await formatJavaScript(code)

    return {
      path: filePath,
      content: formatted,
    }
  }

  /**
   * Generate TypeScript declaration file
   */
  private async generateTypes(icons: IconMetadata[]): Promise<GeneratedFile> {
    const fileName = 'types.ts'
    const filePath = join(this.options.dir, fileName)

    const iconNames = icons.map(icon => `  | '${icon.name}'`).join('\n')

    const componentInterfaces = icons
      .map(icon => {
        const tagName = this.getTagName(icon.name)
        const className = toPascalCase(this.getComponentName(icon.name))
        return `  '${tagName}': ${className}`
      })
      .join('\n')

    const code = `// Auto-generated types
import { IconMetadata } from '@picto/core'

export type IconName =
${iconNames}

export interface WebComponentsMap {
${componentInterfaces}
}

// Augment global JSX namespace for TypeScript/React
declare global {
  namespace JSX {
    interface IntrinsicElements {
${icons
  .map(icon => {
    const tagName = this.getTagName(icon.name)
    return `      '${tagName}': { width?: string | number; height?: string | number; color?: string }`
  })
  .join('\n')}
    }
  }
}

export const iconMetadata: Record<IconName, IconMetadata> = {
${icons
  .map(icon => {
    return `  '${icon.name}': ${JSON.stringify(
      {
        id: icon.id,
        name: icon.name,
        displayName: icon.displayName || icon.name,
        description: icon.description || '',
        category: icon.category || '',
        width: icon.width,
        height: icon.height,
        viewBox: icon.viewBox || '',
        tags: icon.tags || [],
      },
      null,
      2
    )},`
  })
  .join('\n')}
}
`
    const formatted = await formatTypeScript(code)

    return {
      path: filePath,
      content: formatted,
    }
  }

  /**
   * Generate registry file for easy registration
   */
  private async generateRegistry(icons: IconMetadata[]): Promise<GeneratedFile> {
    const ext = this.options.typescript ? '.ts' : '.js'
    const fileName = `registry${ext}`
    const filePath = join(this.options.dir, fileName)

    const imports = icons
      .map(icon => {
        const componentName = this.getComponentName(icon.name)
        return `import './${componentName}'`
      })
      .join('\n')

    const code = `// Auto-generated registry
// Import this file to register all Web Components

${imports}

export const registeredComponents = [
${icons.map(icon => `  '${this.getTagName(icon.name)}'`).join(',\n')}
];
`
    const formatted = this.options.typescript
      ? await formatTypeScript(code)
      : await formatJavaScript(code)

    return {
      path: filePath,
      content: formatted,
    }
  }

  /**
   * Get component name applying naming conventions
   */
  private getComponentName(iconName: string): string {
    const transformed = applyNaming(iconName, {
      ...this.options.naming,
      prefix: this.options.prefix,
    })

    return toKebabCase(transformed)
  }

  /**
   * Get custom element tag name
   */
  private getTagName(iconName: string): string {
    const componentName = this.getComponentName(iconName)
    return componentName
  }
}
