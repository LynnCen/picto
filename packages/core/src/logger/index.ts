/**
 * Logger
 * Centralized logging system
 */

import { consola, type ConsolaInstance } from 'consola'

export class Logger {
  private consola: ConsolaInstance
  private prefix: string

  constructor(prefix = 'picto') {
    this.prefix = prefix
    this.consola = consola.withTag(prefix)
  }

  /**
   * Log info message
   */
  info(message: string, ...args: unknown[]): void {
    this.consola.info(message, ...args)
  }

  /**
   * Log success message
   */
  success(message: string, ...args: unknown[]): void {
    this.consola.success(message, ...args)
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: unknown[]): void {
    this.consola.warn(message, ...args)
  }

  /**
   * Log error message
   */
  error(message: string, ...args: unknown[]): void {
    this.consola.error(message, ...args)
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: unknown[]): void {
    this.consola.debug(message, ...args)
  }

  /**
   * Log verbose message
   */
  verbose(message: string, ...args: unknown[]): void {
    this.consola.verbose(message, ...args)
  }

  /**
   * Start a timer
   */
  time(label: string): void {
    // eslint-disable-next-line no-console
    console.time(`[${this.prefix}] ${label}`)
  }

  /**
   * End a timer
   */
  timeEnd(label: string): void {
    // eslint-disable-next-line no-console
    console.timeEnd(`[${this.prefix}] ${label}`)
  }

  /**
   * Create a child logger with additional prefix
   */
  child(childPrefix: string): Logger {
    return new Logger(`${this.prefix}:${childPrefix}`)
  }
}

// Export default instance
export const logger = new Logger()
