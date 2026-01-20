/**
 * Change Detector
 * Detects changes between old and new icon sets
 */

import type { IconMetadata } from '@picto/types'
import type { Logger } from '../logger'

export interface ChangeSet {
  added: IconMetadata[]
  removed: IconMetadata[]
  modified: IconMetadata[]
  unchanged: IconMetadata[]
}

export class ChangeDetector {
  private logger?: Logger

  constructor(logger?: Logger) {
    this.logger = logger
  }

  /**
   * Detect changes between old and new icon sets
   */
  detectChanges(oldIcons: IconMetadata[], newIcons: IconMetadata[]): ChangeSet {
    this.logger?.info('Detecting changes in icon set...')

    const oldMap = new Map<string, IconMetadata>()
    const newMap = new Map<string, IconMetadata>()

    // Build maps for efficient lookup
    oldIcons.forEach(icon => oldMap.set(icon.id, icon))
    newIcons.forEach(icon => newMap.set(icon.id, icon))

    const added: IconMetadata[] = []
    const removed: IconMetadata[] = []
    const modified: IconMetadata[] = []
    const unchanged: IconMetadata[] = []

    // Find added and modified icons
    for (const newIcon of newIcons) {
      const oldIcon = oldMap.get(newIcon.id)

      if (!oldIcon) {
        // Icon is new
        added.push(newIcon)
      } else {
        // Check if icon was modified
        if (this.isModified(oldIcon, newIcon)) {
          modified.push(newIcon)
        } else {
          unchanged.push(newIcon)
        }
      }
    }

    // Find removed icons
    for (const oldIcon of oldIcons) {
      if (!newMap.has(oldIcon.id)) {
        removed.push(oldIcon)
      }
    }

    this.logger?.success(
      `Changes detected: ${added.length} added, ${modified.length} modified, ${removed.length} removed, ${unchanged.length} unchanged`
    )

    return {
      added,
      removed,
      modified,
      unchanged,
    }
  }

  /**
   * Check if icon was modified
   */
  private isModified(oldIcon: IconMetadata, newIcon: IconMetadata): boolean {
    // Compare by hash if available
    if (oldIcon.hash && newIcon.hash) {
      return oldIcon.hash !== newIcon.hash
    }

    // Otherwise compare SVG content
    return oldIcon.svg !== newIcon.svg
  }

  /**
   * Check if incremental update is worthwhile
   */
  shouldUseIncremental(changeSet: ChangeSet, threshold = 0.3): boolean {
    const total =
      changeSet.added.length +
      changeSet.removed.length +
      changeSet.modified.length +
      changeSet.unchanged.length

    if (total === 0) {
      return false
    }

    const changedCount =
      changeSet.added.length +
      changeSet.removed.length +
      changeSet.modified.length

    const changeRatio = changedCount / total

    // If changes are less than threshold, use incremental update
    return changeRatio < threshold
  }
}
