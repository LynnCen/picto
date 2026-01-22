import { defineConfig } from '@picto/core'

export default defineConfig({
  sources: [
    {
      type: 'figma',
      url: 'https://www.figma.com/file/lNtZjYrzLjkZohZLP0OVnz/Gaoding-%E5%9B%BE%E6%A0%87%E5%BA%93(%E9%93%BE%E6%8E%A5%E5%89%8D%E7%AB%AF%E9%A1%B9%E7%9B%AE)?node-id=615%3A324',
      token: '291200-0792e958-bc89-47ab-8a04-12478816ec02',
      includeComponents: true,
      includeInstances: false,
      filters:{
        categories: ['通用图标'],
      }
    },
  ],
  outputs: [
    {
      type: 'vue',
      dir: './icons',

      options: {},
    },
  ],
  naming: {
    case: 'camel',
    prefix: 'Icon',
  },
})
