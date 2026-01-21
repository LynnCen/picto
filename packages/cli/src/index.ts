/**
 * Picto CLI
 *
 * Command-line interface for Picto icon management tool.
 */

import cac from 'cac'
import { version } from '@picto/core'

export function cli(): void {
  const program = cac('picto')

  program
    .version(version)
    .help()
    .option('--config <path>', 'Path to config file')
    .option('--verbose', 'Enable verbose logging')

  // init command
  program
    .command('init', 'Initialize a new Picto project')
    .option('--force', 'Force overwrite existing config')
    .option('--template <name>', 'Use a specific template')
    .action(async (options: { force?: boolean; template?: string }) => {
      const { initCommand } = await import('./commands/init')
      await initCommand(options)
    })

  // pull command
  program
    .command('pull [source]', 'Pull icons from a source')
    .option('--output <dir>', 'Output directory')
    .option('--token <token>', 'API token')
    .option('--dry-run', 'Preview without writing files')
    .action(
      async (
        source: string | undefined,
        options: { output?: string; token?: string; dryRun?: boolean; config?: string }
      ) => {
        const { pullCommand } = await import('./commands/pull')
        await pullCommand(source, options)
      }
    )

  // sync command (alias for pull)
  program
    .command('sync', 'Sync icons from all configured sources')
    .option('--output <dir>', 'Output directory')
    .option('--dry-run', 'Preview without writing files')
    .action(async (options: { output?: string; dryRun?: boolean; config?: string }) => {
      const { syncCommand } = await import('./commands/sync')
      await syncCommand(options)
    })

  // dev command (watch mode)
  program
    .command('dev', 'Start development mode with file watching')
    .option('--cwd <dir>', 'Working directory')
    .action(async (options: { config?: string; cwd?: string }) => {
      const { devCommand } = await import('./commands/dev')
      await devCommand(options)
    })

  // Parse CLI arguments
  program.parse()
}

export { version }
