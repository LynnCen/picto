import { defineConfig } from '@picto/core'

/**
 * Picto Configuration - Local SVG to Multi-framework Demo
 *
 * This demo shows how to:
 * 1. Scan local SVG files
 * 2. Generate components for multiple frameworks (React, Vue, Web Components)
 * 3. Output optimized SVG files
 * 4. Generate JSON metadata
 */
export default defineConfig({
  sources: [
    {
      type: 'local',
      dir: './assets/icons',
      pattern: '**/*.svg',
      filters: {
        // Optional: filter by name pattern
        // namePattern: /^icon-/,
      },
    },
  ],

  outputs: [
    // React components
    {
      type: 'react',
      dir: './icons/react',
      options: {
        typescript: true,
        memo: true,
      },
    },
    // Vue components
    {
      type: 'vue',
      dir: './icons/vue',
      options: {
        typescript: true,
        compositionApi: true,
      },
    },
    // Web Components
    {
      type: 'web-components',
      dir: './icons/web-components',
      options: {
        typescript: false,
        shadowDom: true,
      },
    },
    // Optimized SVG files
    {
      type: 'svg',
      dir: './icons/svg',
      options: {
        svgo: true,
        jsonIndex: true,
      },
    },
  ],

  naming: {
    case: 'pascal',
    prefix: 'Icon',
  },

  optimization: {
    svgo: true,
    removeComments: true,
    removeMetadata: true,
  },

  cache: {
    enabled: true,
  },
})
