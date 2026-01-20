/**
 * Picto Core Library
 *
 * This is the core library that provides the main functionality for Picto.
 * It includes the engine, plugin system, configuration, and utility functions.
 */

export const version = '0.5.0'

// Export configuration
export * from './config'

// Export engine
export * from './engine'

// Export plugin manager
export * from './plugins/manager'

// Export logger
export * from './logger'

// Export sources
export * from './sources/figma'

// Export generators
export * from './generators/react'
export * from './generators/vue'
export * from './generators/svg'

// Export utilities
export * from './generators/utils/naming'
export * from './generators/utils/formatter'

// Note: Types are exported from @picto/types package directly
// Use: import type { IconMetadata, Config } from '@picto/types'
