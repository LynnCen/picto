/**
 * Picto Types
 *
 * Shared TypeScript types for Picto
 */

/**
 * Icon metadata
 */
export interface IconMetadata {
  id: string
  name: string
  displayName?: string
  description?: string
  category?: string
  tags?: string[]
  variants?: IconVariant[]
  svg: string
  width: number
  height: number
  viewBox?: string
  source: IconSource
  colors?: string[]
  generatedAt: Date
  hash?: string
}

/**
 * Icon variant (for icon families/sets)
 */
export interface IconVariant {
  name: string
  type: 'size' | 'style' | 'color' | 'state' | 'custom'
  value: string | number
  metadata?: Record<string, unknown>
}

/**
 * Icon source information
 */
export interface IconSource {
  type: 'figma' | 'iconfont' | 'local' | 'custom'
  url?: string
  nodeId?: string
  fileKey?: string
  lastSynced?: Date
  metadata?: Record<string, unknown>
}

/**
 * Base plugin interface
 */
export interface Plugin {
  name: string
  version?: string
  type: 'source' | 'processor' | 'generator'
  setup?: () => Promise<void> | void
  teardown?: () => Promise<void> | void
}

/**
 * Source plugin - Fetches icons from external sources
 */
export interface SourcePlugin extends Plugin {
  type: 'source'
  fetch: (options: Record<string, unknown>) => Promise<IconMetadata[]>
}

/**
 * Processor plugin - Transforms/processes icons
 */
export interface ProcessorPlugin extends Plugin {
  type: 'processor'
  process: (icon: IconMetadata, options: Record<string, unknown>) => Promise<IconMetadata>
}

/**
 * Generator plugin - Generates output files
 */
export interface GeneratorPlugin extends Plugin {
  type: 'generator'
  generate: (icons: IconMetadata[], options: Record<string, unknown>) => Promise<GeneratedFile[]>
}

/**
 * Generator options
 */
export interface GeneratorOptions {
  dir: string
  filename?: string
  typescript?: boolean
  [key: string]: unknown
}

/**
 * Generated file
 */
export interface GeneratedFile {
  path: string
  content: string
  encoding?: BufferEncoding
}

/**
 * Plugin context
 */
export interface PluginContext {
  logger: {
    info: (message: string) => void
    warn: (message: string) => void
    error: (message: string) => void
    debug: (message: string) => void
  }
  config: Record<string, unknown>
}

/**
 * Cache entry
 */
export interface CacheEntry<T = unknown> {
  key: string
  value: T
  timestamp: number
  ttl: number
}

/**
 * Pipeline context
 */
export interface PipelineContext {
  startTime: Date
  endTime?: Date
  duration?: number
  icons: IconMetadata[]
  errors: Error[]
  warnings: string[]
}
