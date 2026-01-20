/**
 * Sync command - Sync icons from all configured sources
 */

import { pullCommand } from './pull'

interface SyncOptions {
  output?: string
  dryRun?: boolean
  config?: string
}

export async function syncCommand(options: SyncOptions): Promise<void> {
  // Sync is essentially the same as pull for all configured sources
  await pullCommand(undefined, options)
}
