# Demo: Local SVG to Multi-framework Components

> 演示如何扫描本地 SVG 文件并生成多框架组件

## 📝 功能展示

- ✅ 扫描本地 SVG 文件
- ✅ 同时生成 React、Vue、Web Components 组件
- ✅ 输出优化后的 SVG 文件
- ✅ 生成 JSON 元数据
- ✅ 支持目录分类

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 准备 SVG 文件

将你的 SVG 图标文件放入 `assets/icons` 目录：

```
assets/icons/
├── actions/
│   ├── add.svg
│   ├── delete.svg
│   └── edit.svg
├── arrows/
│   ├── arrow-left.svg
│   ├── arrow-right.svg
│   └── arrow-up.svg
└── social/
    ├── github.svg
    └── twitter.svg
```

### 3. 拉取图标

```bash
# 一次性拉取
pnpm pull

# 或使用 watch 模式（监听 SVG 文件变化）
pnpm dev
```

## 📂 生成的文件结构

```
icons/
├── react/
│   ├── IconAdd.tsx
│   ├── IconArrowLeft.tsx
│   ├── index.ts
│   └── types.ts
├── vue/
│   ├── IconAdd.vue
│   ├── IconArrowLeft.vue
│   ├── index.ts
│   └── types.ts
├── web-components/
│   ├── icon-add.js
│   ├── icon-arrow-left.js
│   ├── index.js
│   └── registry.js
└── svg/
    ├── icon-add.svg
    ├── icon-arrow-left.svg
    └── icons.json
```

## 💻 使用生成的组件

### React

```tsx
import { IconAdd, IconArrowLeft } from './icons/react'

function App() {
  return (
    <div>
      <IconAdd width={24} height={24} />
      <IconArrowLeft className="text-blue-500" />
    </div>
  )
}
```

### Vue 3

```vue
<script setup lang="ts">
import { IconAdd, IconArrowLeft } from './icons/vue'
</script>

<template>
  <div>
    <IconAdd :width="24" :height="24" />
    <IconArrowLeft class="text-blue-500" />
  </div>
</template>
```

### Web Components

```html
<script type="module">
  import './icons/web-components/index.js'
</script>

<icon-add width="24" height="24"></icon-add>
<icon-arrow-left class="text-blue-500"></icon-arrow-left>
```

## ⚙️ 配置说明

### 源配置

```typescript
sources: [
  {
    type: 'local',
    dir: './assets/icons',        // SVG 文件目录
    pattern: '**/*.svg',          // glob 模式
    filters: {
      namePattern: /^icon-/,      // 名称过滤（可选）
    }
  }
]
```

### 多框架输出

```typescript
outputs: [
  { type: 'react', dir: './icons/react' },
  { type: 'vue', dir: './icons/vue' },
  { type: 'web-components', dir: './icons/web-components' },
  { type: 'svg', dir: './icons/svg' },
]
```

## 🎯 高级用法

### 目录分类

SVG 文件的目录结构会反映在组件的 `category` 属性中：

```
assets/icons/
└── actions/
    └── add.svg  → category: "actions"
```

### Watch 模式

使用 `pnpm dev` 开启 watch 模式，文件变化会自动触发重新生成：

```bash
pnpm dev
# 现在修改任何 SVG 文件，组件会自动更新
```

## 🔗 相关资源

- [SVG 优化指南](https://web.dev/fast/#optimize-your-images)
- [Picto 完整文档](../../docs)

## 📚 更多示例

- [Figma → React](../demo-figma-react)
- [Iconfont → Vue](../demo-iconfont-vue)
- [完整功能演示](../demo-full-features)
