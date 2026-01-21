import { defineConfig } from '@picto/core'

/**
 * Picto Configuration - Full Features Showcase
 *
 * This configuration demonstrates all available options and features:
 * - Multiple sources (Figma, Iconfont, Local)
 * - All generator types
 * - Advanced naming conventions
 * - Optimization settings
 * - Caching configuration
 * - Advanced options
 */
export default defineConfig({
  // ==================== SOURCES ====================
  sources: [
    // Figma source with advanced options
    {
      type: 'figma',
      url: 'https://www.figma.com/file/YOUR_FILE_KEY/Your-Icon-Library',
      token: process.env.FIGMA_ACCESS_TOKEN || '',
      // Specify which node IDs to include
      nodeIds: ['123:456', '789:012'],
      // Component set IDs
      componentSets: ['component-set-id-1'],
      // Include options
      includeComponents: true,
      includeInstances: false,
      // Filters
      filters: {
        namePattern: /^icon-/,
        variants: ['24', 'filled'],
        categories: ['actions', 'arrows'],
      },
    },

    // Iconfont source
    {
      type: 'iconfont',
      projectId: 'YOUR_PROJECT_ID',
      cssUrl: 'https://at.alicdn.com/t/YOUR_PROJECT.css',
      token: process.env.ICONFONT_TOKEN,
      filters: {
        namePattern: /^icon-/,
        unicode: ['e600', 'e601'],
      },
    },

    // Local SVG source
    {
      type: 'local',
      dir: './assets/icons',
      pattern: '**/*.svg',
      filters: {
        namePattern: /^icon-/,
      },
    },
  ],

  // ==================== OUTPUTS ====================
  outputs: [
    // React with all options
    {
      type: 'react',
      dir: './icons/react',
      options: {
        typescript: true,
        memo: true,
        propTypes: false,
      },
    },

    // Vue with Composition API
    {
      type: 'vue',
      dir: './icons/vue',
      options: {
        typescript: true,
        compositionApi: true,
      },
    },

    // Web Components with Shadow DOM
    {
      type: 'web-components',
      dir: './icons/web-components',
      options: {
        typescript: false,
        shadowDom: true,
      },
    },

    // Optimized SVG files with JSON index
    {
      type: 'svg',
      dir: './icons/svg',
      options: {
        svgo: true,
        jsonIndex: true,
      },
    },

    // JSON metadata
    {
      type: 'json',
      dir: './icons',
      options: {
        filename: 'icons.json',
      },
    },
  ],

  // ==================== NAMING ====================
  naming: {
    // Naming case: 'kebab' | 'camel' | 'pascal' | 'snake'
    case: 'pascal',
    // Add prefix to all icon names
    prefix: 'Icon',
    // Add suffix to all icon names
    // suffix: 'Icon',
    // Remove prefixes from source icon names
    removePrefix: ['ic_', 'icon_'],
    // Remove suffixes from source icon names
    removeSuffix: ['_24', '_filled'],
  },

  // ==================== OPTIMIZATION ====================
  optimization: {
    // Enable SVGO optimization
    svgo: true,
    // Custom SVGO configuration
    svgoConfig: {
      plugins: [
        {
          name: 'preset-default',
          params: {
            overrides: {
              removeViewBox: false,
            },
          },
        },
        'removeDimensions',
      ],
    },
    // Remove comments from SVG
    removeComments: true,
    // Remove metadata from SVG
    removeMetadata: true,
    // Minify output code
    minify: false,
  },

  // ==================== CACHE ====================
  cache: {
    // Enable caching
    enabled: true,
    // Cache directory
    dir: '.picto/cache',
    // Time to live in seconds (1 hour)
    ttl: 3600,
  },

  // ==================== ADVANCED ====================
  advanced: {
    // Maximum concurrent requests
    concurrency: 5,
    // Request timeout in milliseconds
    timeout: 30000,
    // Number of retries on failure
    retry: 3,
    // Log level: 'silent' | 'error' | 'warn' | 'info' | 'debug'
    logLevel: 'info',
  },
})
