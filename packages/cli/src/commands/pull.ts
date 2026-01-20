/**
 * Pull command - Pull icons from a specific source
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve, relative } from 'node:path'
import ora from 'ora'
import { logger } from '../utils/logger'
import { loadConfig } from '@picto/core'
import { PictoEngine } from '@picto/core'

interface PullOptions {
  output?: string
  token?: string
  dryRun?: boolean
  config?: string
}

export async function pullCommand(source: string | undefined, options: PullOptions): Promise<void> {
  logger.info(`Pulling icons${source ? ` from ${source}` : ''}...`)

  if (options.dryRun) {
    logger.warn('Dry run mode - no files will be written')
  }

  const spinner = ora('Loading configuration...').start()

  try {
    // Load config file
    const { config } = await loadConfig({
      configPath: options.config,
    })

    // Override token if provided via CLI
    if (options.token) {
      config.sources = config.sources.map(source => {
        if (source.type === 'figma') {
          return { ...source, token: options.token! }
        }
        return source
      })
    }

    // Override output dir if provided
    if (options.output) {
      config.outputs = config.outputs.map((output, index) =>
        index === 0 ? { ...output, dir: options.output! } : output
      )
    }

    spinner.text = 'Initializing engine...'

    // Initialize engine
    const engine = new PictoEngine({ config, logger })
    await engine.initialize()

    spinner.text = 'Fetching icons...'

    // Execute pipeline
    const result = await engine.execute()

    spinner.text = `Generating ${result.files.length} file(s)...`

    if (!options.dryRun) {
      spinner.text = 'Writing files to disk...'

      // Get base output directory for security check
      const baseOutputDir = resolve(config.outputs[0]?.dir || './dist')

      // Write files
      for (const file of result.files) {
        // Security check: ensure file path is within output directory
        const targetPath = resolve(file.path)
        const relativePath = relative(baseOutputDir, targetPath)

        if (
          relativePath.startsWith('..') ||
          resolve(relativePath) === resolve(relativePath, '..')
        ) {
          throw new Error(
            `Security: File path "${file.path}" is outside output directory "${baseOutputDir}"`
          )
        }

        await mkdir(dirname(file.path), { recursive: true })
        await writeFile(file.path, file.content, 'utf-8')
      }

      spinner.succeed(`Successfully generated ${result.files.length} file(s)!`)
    } else {
      spinner.succeed(`Dry run: Would generate ${result.files.length} file(s)`)
    }

    logger.success('\n✨ Done!')
    logger.info(`Found ${result.icons.length} icon(s)`)
    logger.info(`Generated ${result.files.length} file(s)`)

    if (config.outputs[0]) {
      logger.info(`Output directory: ${config.outputs[0].dir}`)
    }
  } catch (error) {
    spinner.fail('Failed to pull icons')

    if (error instanceof Error) {
      logger.error(error.message)
    }

    throw error
  }
}
