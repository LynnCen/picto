# Demo: Iconfont to Vue Components

> 演示如何从 Iconfont（阿里巴巴矢量图标库）拉取图标并生成 Vue 3 组件

## 📝 功能展示

- ✅ 从 Iconfont 拉取图标
- ✅ 生成 Vue 3 Composition API 组件
- ✅ TypeScript 支持
- ✅ 自动应用命名规范
- ✅ SVG 优化

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 获取 Iconfont 项目信息

访问 [Iconfont](https://www.iconfont.cn/)，找到你的项目：

- **Project ID**: 在项目设置中查看
- **CSS URL**: 在"Font class" 标签下获取

### 3. 更新配置文件

编辑 `picto.config.ts`：

```typescript
sources: [
  {
    type: 'iconfont',
    projectId: '1234567',  // 你的项目 ID
    cssUrl: 'https://at.alicdn.com/t/c/font_xxx.css',
  }
]
```

### 4. 拉取图标

```bash
# 一次性拉取
pnpm pull

# 或使用 watch 模式
pnpm dev
```

## 📂 生成的文件结构

```
icons/
├── IconArrowLeft.vue      # Vue 组件
├── IconArrowRight.vue
├── IconCheck.vue
├── index.ts               # 统一导出
└── types.ts               # TypeScript 类型定义
```

## 💻 使用生成的组件

```vue
<script setup lang="ts">
import { IconArrowLeft, IconCheck } from './icons'
</script>

<template>
  <div>
    <IconArrowLeft :width="24" :height="24" />
    <IconCheck class="text-green-500" />
  </div>
</template>
```

## ⚙️ 配置说明

### 源配置

```typescript
sources: [
  {
    type: 'iconfont',
    projectId: 'YOUR_PROJECT_ID',       // 项目 ID（必填）
    cssUrl: 'YOUR_CSS_URL',             // CSS URL（推荐）
    token: process.env.ICONFONT_TOKEN,  // 私有项目 Token（可选）
    filters: {
      namePattern: /^icon-/,            // 名称过滤（可选）
      unicode: ['e600', 'e601'],        // Unicode 过滤（可选）
    }
  }
]
```

### 输出配置

```typescript
outputs: [
  {
    type: 'vue',
    dir: './icons',
    options: {
      typescript: true,                 // 生成 TypeScript 文件
      compositionApi: true,             // 使用 Composition API
    }
  }
]
```

## 🔗 相关资源

- [Iconfont 官网](https://www.iconfont.cn/)
- [Vue 3 文档](https://cn.vuejs.org/)
- [Picto 完整文档](../../docs)

## 📚 更多示例

- [Figma → React](../demo-figma-react)
- [本地 SVG → 多框架](../demo-local-svg)
- [完整功能演示](../demo-full-features)
