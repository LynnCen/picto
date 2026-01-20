/**
 * Naming utilities for code generation
 */

export type NamingCase = 'kebab' | 'camel' | 'pascal' | 'snake'

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[-_\s]+(.)?/g, (_: string, char: string | undefined) =>
      char ? char.toUpperCase() : ''
    )
}

/**
 * Convert string to PascalCase
 */
export function toPascalCase(str: string): string {
  const camel = toCamelCase(str)
  return camel.charAt(0).toUpperCase() + camel.slice(1)
}

/**
 * Convert string to snake_case
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase()
}

/**
 * Convert string to specified case
 */
export function toCase(str: string, caseType: NamingCase): string {
  switch (caseType) {
    case 'kebab':
      return toKebabCase(str)
    case 'camel':
      return toCamelCase(str)
    case 'pascal':
      return toPascalCase(str)
    case 'snake':
      return toSnakeCase(str)
  }
}

/**
 * Apply naming transformations (prefix/suffix)
 */
export function applyNaming(
  name: string,
  options: {
    case?: NamingCase
    prefix?: string
    suffix?: string
    removePrefix?: string[]
    removeSuffix?: string[]
  } = {}
): string {
  let result = name

  // Remove prefix/suffix
  if (options.removePrefix) {
    for (const prefix of options.removePrefix) {
      if (result.startsWith(prefix)) {
        result = result.slice(prefix.length)
      }
    }
  }

  if (options.removeSuffix) {
    for (const suffix of options.removeSuffix) {
      if (result.endsWith(suffix)) {
        result = result.slice(0, -suffix.length)
      }
    }
  }

  // Apply case transformation
  if (options.case) {
    result = toCase(result, options.case)
  }

  // Add prefix/suffix
  if (options.prefix) {
    result = options.prefix + result
  }

  if (options.suffix) {
    result = result + options.suffix
  }

  return result
}
