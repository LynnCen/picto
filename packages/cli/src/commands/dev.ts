/**
 * Dev command - Start development mode with file watching
 */

import { resolve } from 'node:path'
import { loadConfig, PictoEngine, Watcher } from '@picto/core'
import { logger } from '../utils/logger'

interface DevOptions {
  config?: string
  cwd?: string
}

export async function devCommand(options: DevOptions = {}): Promise<void> {
  try {
    const cwd = options.cwd || process.cwd()

    logger.info('Starting development mode with file watching...')

    // Load configuration
    const { config, filepath } = await loadConfig({
      cwd,
      configPath: options.config,
    })

    logger.success(`Config loaded from: ${filepath}`)

    // Initialize engine
    const engine = new PictoEngine({
      config,
      logger,
    })

    await engine.initialize()

    // Run initial build
    logger.info('Running initial build...')
    await engine.execute()
    logger.success('Initial build complete!')

    // Watch for config file changes
    const configFile = filepath

    // Watch for source changes (if local sources are used)
    const watchPaths: string[] = [configFile]

    // Add local source directories to watch
    for (const source of config.sources) {
      if (source.type === 'local') {
        const localPath = resolve(cwd, source.dir)
        watchPaths.push(localPath)
        logger.info(`Watching local source: ${localPath}`)
      }
    }

    // Start watcher
    const watcher = new Watcher({
      paths: watchPaths,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.picto/**'],
      debounceDelay: 300,
      logger,
      onChange: async (path, event): Promise<void> => {
        logger.info(`File ${event}: ${path}`)
        logger.info('Rebuilding...')

        try {
          await engine.execute()
          logger.success('Rebuild complete!')
        } catch (error) {
          logger.error('Rebuild failed:', error)
        }
      },
    })

    watcher.start()

    logger.success('👀 Watching for changes... Press Ctrl+C to stop')
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message)
    } else {
      logger.error('An unknown error occurred')
    }
    process.exit(1)
  }
}
