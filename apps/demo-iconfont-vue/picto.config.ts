import { defineConfig } from '@picto/core'

/**
 * Picto Configuration - Iconfont to Vue Demo
 *
 * This demo shows how to:
 * 1. Pull icons from Iconfont (Alibaba Icon Font)
 * 2. Generate Vue 3 components with Composition API
 * 3. Support TypeScript
 */
export default defineConfig({
  sources: [
    {
      type: 'iconfont',
      // Your Iconfont project ID
      projectId: 'YOUR_PROJECT_ID',
      // Optional: Iconfont CSS URL
      cssUrl: 'https://at.alicdn.com/t/YOUR_PROJECT.css',
      // Optional: Token for private projects
      token: process.env.ICONFONT_TOKEN,
    },
  ],

  outputs: [
    {
      type: 'vue',
      dir: './icons',
      options: {
        typescript: true,
        compositionApi: true,
      },
    },
  ],

  naming: {
    case: 'pascal',
    prefix: 'Icon',
  },

  optimization: {
    svgo: true,
  },

  cache: {
    enabled: true,
  },
})
