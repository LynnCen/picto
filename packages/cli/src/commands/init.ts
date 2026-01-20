/**
 * Init command - Initialize a new Picto project
 */

import { writeFile, access } from 'node:fs/promises'
import { join } from 'node:path'
import prompts from 'prompts'
import ora from 'ora'
import { logger } from '../utils/logger'

interface InitOptions {
  force?: boolean
  template?: string
}

const CONFIG_TEMPLATE = `import { defineConfig } from '@picto/core'

export default defineConfig({
  sources: [
    {
      type: 'figma',
      url: 'https://www.figma.com/file/YOUR_FILE_ID/Your-Icon-Library',
      token: process.env.FIGMA_ACCESS_TOKEN || '',
    },
  ],
  outputs: [
    {
      type: 'react',
      dir: './src/components/icons',
      options: {
        typescript: true,
        memo: true,
      },
    },
  ],
  naming: {
    case: 'pascal',
    prefix: 'Icon',
  },
})
`

export async function initCommand(options: InitOptions): Promise<void> {
  logger.info('Initializing Picto project...')

  const configPath = join(process.cwd(), 'picto.config.ts')

  // Check if config exists
  if (!options.force) {
    try {
      await access(configPath)
      const response = await prompts({
        type: 'confirm',
        name: 'overwrite',
        message: 'Config file already exists. Overwrite?',
        initial: false,
      })

      if (!response.overwrite) {
        logger.info('Cancelled.')
        return
      }
    } catch {
      // File doesn't exist, continue
    }
  }

  const spinner = ora('Creating config file...').start()

  try {
    await writeFile(configPath, CONFIG_TEMPLATE, 'utf-8')
    spinner.succeed('Config file created: picto.config.ts')

    logger.success('\n✨ Picto project initialized!')
    logger.info('\nNext steps:')
    logger.info('  1. Edit picto.config.ts with your configuration')
    logger.info('  2. Set up your FIGMA_ACCESS_TOKEN environment variable')
    logger.info('  3. Run: picto pull')
  } catch (error) {
    spinner.fail('Failed to create config file')
    throw error
  }
}
