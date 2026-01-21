/**
 * Configuration loader
 * Supports loading config from TypeScript, JSON, and YAML files
 */

import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { resolve, extname, dirname } from 'node:path'
import { createRequire } from 'node:module'
import { ConfigSchema, type Config } from './schema'
import type { ZodError } from 'zod'

export interface LoadConfigOptions {
  cwd?: string
  configPath?: string
}

export interface LoadConfigResult {
  config: Config
  filepath: string
}

const CONFIG_FILES = [
  'picto.config.ts',
  'picto.config.js',
  'picto.config.mjs',
  'picto.config.json',
  '.pictorc.json',
  '.pictorc',
]

/**
 * Load configuration file
 */
export async function loadConfig(options: LoadConfigOptions = {}): Promise<LoadConfigResult> {
  const cwd = options.cwd || process.cwd()
  let filepath: string

  // If config path is specified, use it
  if (options.configPath) {
    filepath = resolve(cwd, options.configPath)
  } else {
    // Try to find config file
    filepath = await findConfigFile(cwd)
  }

  // Load and parse config
  const rawConfig = await loadConfigFile(filepath)

  // Validate config
  const result = ConfigSchema.safeParse(rawConfig)

  if (!result.success) {
    throw new ConfigValidationError(result.error, filepath)
  }

  return {
    config: result.data,
    filepath,
  }
}

/**
 * Find config file in directory
 */
async function findConfigFile(cwd: string): Promise<string> {
  for (const filename of CONFIG_FILES) {
    try {
      const filepath = resolve(cwd, filename)
      await readFile(filepath)
      return filepath
    } catch {
      // Continue to next file
    }
  }

  throw new Error(
    `No config file found. Please create one of: ${CONFIG_FILES.join(', ')}\n` +
      'Run "picto init" to create a config file.'
  )
}

/**
 * Load config file based on extension
 */
async function loadConfigFile(filepath: string): Promise<unknown> {
  const ext = extname(filepath)

  switch (ext) {
    case '.ts':
    case '.mts':
    case '.js':
    case '.mjs':
      return await loadTsOrJsConfig(filepath)

    case '.json':
    case '':
      return await loadJsonConfig(filepath)

    default:
      throw new Error(`Unsupported config file format: ${ext}`)
  }
}

/**
 * Load TypeScript or JavaScript config
 */
async function loadTsOrJsConfig(filepath: string): Promise<unknown> {
  const ext = extname(filepath)

  try {
    // For .mjs/.js files, use native ESM import
    if (ext === '.mjs' || ext === '.js') {
      const fileUrl = pathToFileURL(filepath).href
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const module = await import(fileUrl)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
      return module.default || module
    }

    // For .ts/.mts files, use jiti for on-the-fly transpilation
    if (ext === '.ts' || ext === '.mts') {
      // Dynamic import jiti to avoid bundling issues
      const require = createRequire(import.meta.url)
      // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
      const createJiti = require('jiti')

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const jiti = createJiti(dirname(filepath), {
        interopDefault: true,
        esmResolve: true,
      })

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const config = jiti(filepath)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return config.default || config
    }

    throw new Error(`Unsupported file extension: ${ext}`)
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(
        `Failed to load config file: ${filepath}\n` +
          `Error: ${error.message}\n\n` +
          'Tip: Make sure your config file is valid JavaScript/TypeScript and exports a default config.'
      )
    }
    throw error
  }
}

/**
 * Load JSON config
 */
async function loadJsonConfig(filepath: string): Promise<unknown> {
  try {
    const content = await readFile(filepath, 'utf-8')
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return JSON.parse(content)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file: ${filepath}\n${error.message}`)
    }
    throw error
  }
}

/**
 * Merge configs with priority: CLI args > config file > defaults
 */
export function mergeConfig(base: Partial<Config>, override: Partial<Config>): Config {
  // Simple deep merge - in production you might want to use a library like defu
  const merged = {
    ...base,
    ...override,
    sources: override.sources || base.sources || [],
    outputs: override.outputs || base.outputs || [],
    naming: { ...base.naming, ...override.naming },
    optimization: { ...base.optimization, ...override.optimization },
    cache: { ...base.cache, ...override.cache },
    plugins: override.plugins || base.plugins || [],
    advanced: { ...base.advanced, ...override.advanced },
  }

  return ConfigSchema.parse(merged)
}

/**
 * Custom error for config validation failures
 */
export class ConfigValidationError extends Error {
  constructor(
    public zodError: ZodError,
    public filepath: string
  ) {
    super('Configuration validation failed')
    this.name = 'ConfigValidationError'
  }

  /**
   * Format error message for display
   */
  format(): string {
    const issues = this.zodError.issues || []
    const errors = issues.map(err => {
      const path = err.path.map(String).join('.')
      return `  - ${path}: ${err.message}`
    })

    return (
      `Configuration validation failed in: ${this.filepath}\n\n` +
      'Errors:\n' +
      errors.join('\n') +
      '\n\nPlease fix the errors and try again.'
    )
  }
}
