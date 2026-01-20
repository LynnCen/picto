/**
 * Code formatter using Prettier
 */

import { format } from 'prettier'

export interface FormatOptions {
  parser: 'typescript' | 'babel' | 'vue' | 'html' | 'json'
  semi?: boolean
  singleQuote?: boolean
  trailingComma?: 'none' | 'es5' | 'all'
  printWidth?: number
  tabWidth?: number
}

/**
 * Format code using Prettier
 */
export async function formatCode(code: string, options: FormatOptions): Promise<string> {
  try {
    return await format(code, {
      parser: options.parser,
      semi: options.semi ?? false,
      singleQuote: options.singleQuote ?? true,
      trailingComma: options.trailingComma ?? 'es5',
      printWidth: options.printWidth ?? 100,
      tabWidth: options.tabWidth ?? 2,
      arrowParens: 'avoid',
      endOfLine: 'lf',
    })
  } catch (error) {
    // If formatting fails, return original code
    return code
  }
}

/**
 * Format TypeScript code
 */
export async function formatTypeScript(code: string): Promise<string> {
  return formatCode(code, { parser: 'typescript' })
}

/**
 * Format JavaScript code
 */
export async function formatJavaScript(code: string): Promise<string> {
  return formatCode(code, { parser: 'babel' })
}

/**
 * Format Vue code
 */
export async function formatVue(code: string): Promise<string> {
  return formatCode(code, { parser: 'vue' })
}

/**
 * Format JSON
 */
export async function formatJSON(data: unknown): Promise<string> {
  const json = JSON.stringify(data, null, 2)
  return formatCode(json, { parser: 'json' })
}
