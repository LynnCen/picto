/**
 * Logger utility
 * Wrapper around consola for consistent logging
 */

import { consola } from 'consola'

export const logger = consola.withTag('picto')

export default logger
