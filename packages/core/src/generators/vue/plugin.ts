/**
 * Vue Generator Plugin
 * Generates Vue 3 Composition API icon components
 */

import { join } from 'node:path'
import type { GeneratorPlugin, IconMetadata, GeneratedFile } from '@picto/types'
import { toPascalCase, toKebabCase, applyNaming } from '../utils/naming'
import { formatVue, formatTypeScript } from '../utils/formatter'
import type { Logger } from '../../logger'
import type { NamingConfig } from '../../config'

export interface VueGeneratorOptions {
  dir: string
  typescript?: boolean
  composition?: boolean
  includeTypes?: boolean
  includeIndex?: boolean
  naming?: NamingConfig
}

export class VueGeneratorPlugin implements GeneratorPlugin {
  name = 'vue-generator'
  version = '0.0.1'
  type = 'generator' as const

  private options: VueGeneratorOptions
  private logger?: Logger

  constructor(options: VueGeneratorOptions, logger?: Logger) {
    this.options = {
      typescript: true,
      composition: true,
      includeTypes: true,
      includeIndex: true,
      ...options,
    }
    this.logger = logger
  }

  /**
   * Generate Vue components
   */
  async generate(
    icons: IconMetadata[],
    _options: Record<string, unknown> = {}
  ): Promise<GeneratedFile[]> {
    this.logger?.info(`Generating Vue components for ${icons.length} icon(s)...`)

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
   * Generate a single Vue component
   */
  private async generateComponent(icon: IconMetadata): Promise<GeneratedFile> {
    const componentName = this.getComponentName(icon.name)
    const fileName = `${componentName}.vue`

    const code = this.generateComponentCode(icon, componentName)
    const formatted = await formatVue(code)

    return {
      path: join(this.options.dir, fileName),
      content: formatted,
    }
  }

  /**
   * Generate component code
   */
  private generateComponentCode(icon: IconMetadata, _componentName: string): string {
    const viewBox = icon.viewBox || `0 0 ${icon.width} ${icon.height}`

    // Extract SVG content (remove outer <svg> tags)
    const svgContent = icon.svg
      .replace(/<svg[^>]*>/i, '')
      .replace(/<\/svg>/i, '')
      .trim()

    const scriptSetup = this.options.typescript
      ? `<script setup lang="ts">
${this.generatePropsInterface(icon)}
withDefaults(defineProps<IconProps>(), {
  size: ${icon.width},
})
</script>`
      : `<script setup>
defineProps({
  size: {
    type: [Number, String],
    default: ${icon.width},
  },
  class: String,
})
</script>`

    const template = `<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="${viewBox}"
    fill="none"
    v-bind="$attrs"
  >
    ${svgContent}
  </svg>
</template>`

    return `${scriptSetup}

${template}
`
  }

  /**
   * Generate props interface
   */
  private generatePropsInterface(icon: IconMetadata): string {
    return `/**
 * ${icon.displayName || icon.name}${icon.description ? `\n * ${icon.description}` : ''}
 * @category ${icon.category || 'icons'}
 */
interface IconProps {
  /** Icon size */
  size?: number | string
  /** Additional CSS classes */
  class?: string
}
`
  }

  /**
   * Generate index file
   */
  private async generateIndex(icons: IconMetadata[]): Promise<GeneratedFile> {
    const ext = this.options.typescript ? '.ts' : '.js'

    const imports = icons
      .map(icon => {
        const componentName = this.getComponentName(icon.name)
        return `import ${componentName} from './${componentName}.vue'`
      })
      .join('\n')

    const exports = icons
      .map(icon => {
        const componentName = this.getComponentName(icon.name)
        return `  ${componentName},`
      })
      .join('\n')

    const code = `// Auto-generated index file
${imports}

export {
${exports}
}

// Vue plugin
export default {
  install(app${this.options.typescript ? ': any' : ''}) {
${icons
  .map(icon => {
    const componentName = this.getComponentName(icon.name)
    return `    app.component('${this.getKebabName(icon.name)}', ${componentName})`
  })
  .join('\n')}
  },
}
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

    const componentNames = icons
      .map(icon => {
        const componentName = this.getComponentName(icon.name)
        return `  ${componentName}: typeof import('./${componentName}.vue')['default']`
      })
      .join('\n')

    const code = `// Auto-generated types
export type IconName =
${iconNames}

export interface IconComponents {
${componentNames}
}

declare module '@vue/runtime-core' {
  export interface GlobalComponents extends IconComponents {}
}

export {}
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

  /**
   * Get kebab-case name for icon
   */
  private getKebabName(iconName: string): string {
    const transformed = applyNaming(iconName, {
      case: 'kebab',
      ...this.options.naming,
    })

    return toKebabCase(transformed)
  }
}
