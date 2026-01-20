/**
 * Configuration schema using Zod
 */

import { z } from 'zod'

// Naming configuration
export const NamingConfigSchema = z.object({
  case: z.enum(['kebab', 'camel', 'pascal', 'snake']).default('pascal'),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
  removePrefix: z.array(z.string()).optional(),
  removeSuffix: z.array(z.string()).optional(),
})

export type NamingConfig = z.infer<typeof NamingConfigSchema>

// Figma source configuration
export const FigmaSourceConfigSchema = z.object({
  type: z.literal('figma'),
  url: z.string().url('Invalid Figma URL'),
  token: z.string().min(1, 'Figma token is required'),
  nodeIds: z.array(z.string()).optional(),
  componentSets: z.array(z.string()).optional(),
  includeComponents: z.boolean().optional().default(true),
  includeInstances: z.boolean().optional().default(false),
  filters: z
    .object({
      namePattern: z.union([z.string(), z.instanceof(RegExp)]).optional(),
      variants: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
    })
    .optional(),
})

export type FigmaSourceConfig = z.infer<typeof FigmaSourceConfigSchema>

// Iconfont source configuration
export const IconfontSourceConfigSchema = z.object({
  type: z.literal('iconfont'),
  projectId: z.string(),
  token: z.string().optional(),
  cssUrl: z.string().url().optional(),
  filters: z
    .object({
      namePattern: z.union([z.string(), z.instanceof(RegExp)]).optional(),
      unicode: z.array(z.string()).optional(),
    })
    .optional(),
})

export type IconfontSourceConfig = z.infer<typeof IconfontSourceConfigSchema>

// Local source configuration
export const LocalSourceConfigSchema = z.object({
  type: z.literal('local'),
  dir: z.string(),
  pattern: z.string().optional().default('**/*.svg'),
  filters: z
    .object({
      namePattern: z.union([z.string(), z.instanceof(RegExp)]).optional(),
    })
    .optional(),
})

export type LocalSourceConfig = z.infer<typeof LocalSourceConfigSchema>

// Union of all source configurations
export const SourceConfigSchema = z.discriminatedUnion('type', [
  FigmaSourceConfigSchema,
  IconfontSourceConfigSchema,
  LocalSourceConfigSchema,
])

export type SourceConfig = z.infer<typeof SourceConfigSchema>

// Output configuration
export const OutputConfigSchema = z.object({
  type: z.enum(['svg', 'react', 'vue', 'web-components', 'font', 'json']),
  dir: z.string(),
  options: z.record(z.string(), z.unknown()).optional().default({}),
})

export type OutputConfig = z.infer<typeof OutputConfigSchema>

// SVGO optimization configuration
export const OptimizationConfigSchema = z.object({
  svgo: z.boolean().optional().default(true),
  svgoConfig: z.record(z.string(), z.unknown()).optional(),
  removeComments: z.boolean().optional().default(true),
  removeMetadata: z.boolean().optional().default(true),
  minify: z.boolean().optional().default(false),
})

export type OptimizationConfig = z.infer<typeof OptimizationConfigSchema>

// Cache configuration
export const CacheConfigSchema = z.object({
  enabled: z.boolean().default(true),
  dir: z.string().default('.picto/cache'),
  ttl: z.number().positive().optional().default(3600), // 1 hour
})

export type CacheConfig = z.infer<typeof CacheConfigSchema>

// Plugin configuration
export const PluginConfigSchema = z.object({
  name: z.string(),
  options: z.record(z.string(), z.unknown()).optional(),
})

export type PluginConfig = z.infer<typeof PluginConfigSchema>

// Advanced configuration
export const AdvancedConfigSchema = z.object({
  concurrency: z.number().positive().optional().default(5),
  timeout: z.number().positive().optional().default(30000), // 30 seconds
  retry: z.number().min(0).optional().default(3),
})

export type AdvancedConfig = z.infer<typeof AdvancedConfigSchema>

// Main configuration schema
export const ConfigSchema = z.object({
  sources: z.array(SourceConfigSchema).min(1, 'At least one source is required'),
  outputs: z.array(OutputConfigSchema).min(1, 'At least one output is required'),
  naming: NamingConfigSchema.optional(),
  optimization: OptimizationConfigSchema.optional(),
  cache: CacheConfigSchema.optional(),
  plugins: z.array(PluginConfigSchema).optional(),
  advanced: AdvancedConfigSchema.optional(),
})

export type Config = z.infer<typeof ConfigSchema>

// Helper function to define config with type hints
export function defineConfig(config: Config): Config {
  return config
}
