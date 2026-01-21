import { defineConfig } from '@picto/core'

export default defineConfig({
  sources: [
    {
      type: 'figma',
      url: 'https://www.figma.com/file/lNtZjYrzLjkZohZLP0OVnz/Gaoding-%E5%9B%BE%E6%A0%87%E5%BA%93(%E9%93%BE%E6%8E%A5%E5%89%8D%E7%AB%AF%E9%A1%B9%E7%9B%AE)?node-id=615%3A324',
      token: '291200-0792e958-bc89-47ab-8a04-12478816ec02',
      includeComponents: true,
      includeInstances: false,
      // 使用 nodeIds 限制拉取范围，避免一次拉取太多导致 413 错误
      nodeIds: ['615:324'],
    },
  ],
  outputs: [
    {
      type: 'react',
      dir: './icons',
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
  optimization: {
    svgo: true,
    removeComments: true,
    removeMetadata: true,
  },
  cache: {
    enabled: true,
    dir: '.picto/cache',
    ttl: 3600,
  },
})
