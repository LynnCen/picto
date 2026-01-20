/**
 * Picto Shared Types
 *
 * This package contains shared TypeScript types used across all Picto packages.
 */

/**
 * Icon metadata - unified intermediate representation
 */
export interface IconMetadata {
  // Basic info
  id: string
  name: string
  originalName: string
  source: IconSource

  // Category info
  category?: string
  tags?: string[]
  variant?: IconVariant

  // Graphic info
  svg: IconSVG

  // Color info
  colorInfo: IconColorInfo

  // Metadata
  metadata: {
    width?: number
    height?: number
    description?: string
    author?: string
    license?: string
    createdAt?: Date
    updatedAt?: Date
  }

  // Internal fields
  _hash?: string
  _sourceData?: unknown
}

/**
 * Icon source information
 */
export interface IconSource {
  type: 'figma' | 'iconfont' | 'local' | 'sketch' | 'custom'
  id: string
  url?: string
  fileKey?: string
  projectId?: string
}

/**
 * Icon variant information
 */
export interface IconVariant {
  style?: 'filled' | 'outlined' | 'rounded' | 'sharp'
  weight?: 'thin' | 'light' | 'regular' | 'medium' | 'bold'
  size?: number | 'sm' | 'md' | 'lg' | 'xl'
  state?: 'default' | 'hover' | 'active' | 'disabled'
}

/**
 * SVG data
 */
export interface IconSVG {
  content: string
  viewBox: string
  width?: string | number
  height?: string | number
  optimized?: string
  paths?: string[]
}

/**
 * Icon color information
 */
export interface IconColorInfo {
  type: 'monochrome' | 'duotone' | 'multicolor'
  palette: string[]
  hasStroke: boolean
  hasFill: boolean
  isConfigurable: boolean
}

/**
 * Raw icon data from sources
 */
export interface RawIconData {
  source: IconSource
  data: unknown
}

/**
 * Configuration types
 */
export type SourceConfig =
  | FigmaSourceConfig
  | IconfontSourceConfig
  | LocalSourceConfig
  | SketchSourceConfig

export interface FigmaSourceConfig {
  type: 'figma'
  url: string
  token: string
  nodeIds?: string[]
  componentSets?: string[]
  includeComponents?: boolean
  includeInstances?: boolean
  filters?: {
    namePattern?: string | RegExp
    variants?: string[]
    categories?: string[]
  }
}

export interface IconfontSourceConfig {
  type: 'iconfont'
  projectId: string
  token?: string
  cssUrl?: string
  filters?: {
    namePattern?: string | RegExp
    unicode?: string[]
  }
}

export interface LocalSourceConfig {
  type: 'local'
  dir: string
  pattern?: string
  filters?: {
    namePattern?: string | RegExp
  }
}

export interface SketchSourceConfig {
  type: 'sketch'
  file: string
  pages?: string[]
  artboards?: string[]
}

export interface Config {
  sources: SourceConfig[]
  outputs: OutputConfig[]
  naming?: NamingConfig
  optimization?: OptimizationConfig
  cache?: CacheConfig
  plugins?: PluginConfig[]
  advanced?: AdvancedConfig
}

export interface OutputConfig {
  type: 'svg' | 'react' | 'vue' | 'web-components' | 'font' | 'json'
  dir: string
  options?: Record<string, unknown>
}

export interface NamingConfig {
  case: 'kebab' | 'camel' | 'pascal' | 'snake'
  prefix?: string
  suffix?: string
  removePrefix?: string[]
  removeSuffix?: string[]
  transform?: (name: string) => string
}

export interface OptimizationConfig {
  svgo?: boolean
  svgoConfig?: Record<string, unknown>
  removeComments?: boolean
  removeMetadata?: boolean
  minify?: boolean
}

export interface CacheConfig {
  enabled: boolean
  dir: string
  ttl?: number
}

export interface PluginConfig {
  name: string
  options?: Record<string, unknown>
}

export interface AdvancedConfig {
  concurrency?: number
  timeout?: number
  retry?: number
}

/**
 * Plugin types
 */
export interface Plugin {
  name: string
  version: string
  type: 'source' | 'processor' | 'generator'
  setup?: (context: PluginContext) => void | Promise<void>
  teardown?: () => void | Promise<void>
}

export interface SourcePlugin extends Plugin {
  type: 'source'
  fetch: (config: SourceConfig) => Promise<RawIconData[]>
}

export interface ProcessorPlugin extends Plugin {
  type: 'processor'
  process: (data: IconMetadata[]) => Promise<IconMetadata[]>
}

export interface GeneratorPlugin extends Plugin {
  type: 'generator'
  generate: (data: IconMetadata[], config: OutputConfig) => Promise<void>
}

export interface PluginContext {
  config: Config
  logger: Logger
  cache: CacheManager
  utils: PluginUtils
}

export interface Logger {
  info: (message: string, ...args: unknown[]) => void
  warn: (message: string, ...args: unknown[]) => void
  error: (message: string, ...args: unknown[]) => void
  debug: (message: string, ...args: unknown[]) => void
  success: (message: string, ...args: unknown[]) => void
}

export interface CacheManager {
  get: <T>(key: string) => Promise<T | null>
  set: <T>(key: string, data: T, ttl?: number) => Promise<void>
  has: (key: string) => Promise<boolean>
  delete: (key: string) => Promise<void>
  clear: () => Promise<void>
  generateKey: (data: unknown) => string
}

export interface PluginUtils {
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<void>
  renderTemplate: (template: string, data: unknown) => string
  resolvePath: (...paths: string[]) => string
  formatName: (name: string, options: NamingConfig) => string
  optimizeSVG: (svg: string, options?: unknown) => Promise<string>
}
