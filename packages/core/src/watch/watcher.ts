/**
 * File Watcher
 * Watches for file changes and triggers regeneration
 */

import chokidar, { type FSWatcher } from 'chokidar'
import { debounce } from '../utils/debounce'
import type { Logger } from '../logger'

export interface WatcherOptions {
  paths: string[]
  ignored?: string | string[]
  debounceDelay?: number
  logger?: Logger
  onChange?: (path: string, event: 'add' | 'change' | 'unlink') => Promise<void> | void
}

export class Watcher {
  private watcher?: FSWatcher
  private options: WatcherOptions
  private logger?: Logger
  private debouncedOnChange: ((path: string, event: 'add' | 'change' | 'unlink') => void) | null = null

  constructor(options: WatcherOptions) {
    this.options = {
      debounceDelay: 300,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      ...options,
    }
    this.logger = options.logger

    if (this.options.onChange) {
      this.debouncedOnChange = debounce(
        async (path: string, event: 'add' | 'change' | 'unlink') => {
          try {
            await this.options.onChange!(path, event)
          } catch (error) {
            this.logger?.error(`Error handling file change: ${path}`, error)
          }
        },
        this.options.debounceDelay!
      )
    }
  }

  /**
   * Start watching
   */
  start(): void {
    if (this.watcher) {
      this.logger?.warn('Watcher is already running')
      return
    }

    this.logger?.info(`Watching for changes in: ${this.options.paths.join(', ')}`)

    this.watcher = chokidar.watch(this.options.paths, {
      ignored: this.options.ignored,
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 100,
        pollInterval: 100,
      },
    })

    this.watcher
      .on('add', path => this.handleChange(path, 'add'))
      .on('change', path => this.handleChange(path, 'change'))
      .on('unlink', path => this.handleChange(path, 'unlink'))
      .on('error', error => this.logger?.error('Watcher error:', error))
      .on('ready', () => this.logger?.success('Watcher is ready'))

    // Handle process termination
    const cleanup = (): void => {
      void this.stop()
      process.exit()
    }

    process.on('SIGINT', cleanup)
    process.on('SIGTERM', cleanup)
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    if (!this.watcher) {
      return
    }

    this.logger?.info('Stopping watcher...')

    try {
      await this.watcher.close()
      this.watcher = undefined
      this.logger?.success('Watcher stopped')
    } catch (error) {
      this.logger?.error('Error stopping watcher:', error)
    }
  }

  /**
   * Handle file change
   */
  private handleChange(path: string, event: 'add' | 'change' | 'unlink'): void {
    this.logger?.debug(`File ${event}: ${path}`)

    if (this.debouncedOnChange) {
      this.debouncedOnChange(path, event)
    }
  }

  /**
   * Check if watcher is running
   */
  isRunning(): boolean {
    return !!this.watcher
  }
}
