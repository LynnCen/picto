/**
 * Local Source Types
 * For scanning local SVG files
 */

export interface LocalFile {
  path: string
  name: string
  category?: string
  content: string
}

import type { Logger } from '../../logger'

export interface LocalSourceOptions {
  dir: string
  pattern?: string
  recursive?: boolean
  cwd?: string
  logger?: Logger
}
