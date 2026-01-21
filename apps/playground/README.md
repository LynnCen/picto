# Picto Playground

> 用于日常开发和测试 Picto CLI 的沙盒环境

## 使用说明

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制环境变量示例文件：

```bash
cp env.example .env
```

编辑 `.env` 文件，填入你的 Token：

```env
FIGMA_ACCESS_TOKEN=your_figma_token_here
```

### 3. 初始化配置

```bash
pnpm init
```

这将生成 `picto.config.ts` 文件，你可以根据需要修改配置。

### 4. 拉取图标

```bash
# 一次性拉取
pnpm pull

# 或使用 watch 模式（推荐开发时使用）
pnpm dev
```

## 配置示例

### Figma → React + Vue

```typescript
import { defineConfig } from '@picto/core'

export default defineConfig({
  sources: [
    {
      type: 'figma',
      url: 'YOUR_FIGMA_FILE_URL',
      token: process.env.FIGMA_ACCESS_TOKEN || '',
    },
  ],
  outputs: [
    {
      type: 'react',
      dir: './icons/react',
      options: { typescript: true, memo: true },
    },
    {
      type: 'vue',
      dir: './icons/vue',
      options: { typescript: true, compositionApi: true },
    },
  ],
  naming: {
    case: 'pascal',
    prefix: 'Icon',
  },
})
```

### Iconfont → React

```typescript
export default defineConfig({
  sources: [
    {
      type: 'iconfont',
      projectId: 'YOUR_PROJECT_ID',
      cssUrl: 'https://at.alicdn.com/t/xxx.css',
    },
  ],
  outputs: [
    {
      type: 'react',
      dir: './icons',
    },
  ],
})
```

### 本地 SVG → 多框架

```typescript
export default defineConfig({
  sources: [
    {
      type: 'local',
      dir: './assets/icons',
      pattern: '**/*.svg',
    },
  ],
  outputs: [
    {
      type: 'react',
      dir: './icons/react',
    },
    {
      type: 'vue',
      dir: './icons/vue',
    },
    {
      type: 'web-components',
      dir: './icons/web-components',
    },
  ],
})
```

## 注意事项

- ⚠️ **生成的图标文件不会被提交到 Git**（已配置 `.gitignore`）
- 📝 配置文件 `picto.config.ts` 也不会被提交，每次需要手动创建
- 🔧 这是一个纯粹的测试环境，可以随意修改和实验

## 相关链接

- [Picto 文档](../../docs)
- [完整示例](../demo-figma-react)
- [更多教程](../demo-local-svg)
