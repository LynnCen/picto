# Demo: Iconfont to Vue Components

这是一个演示项目，展示如何使用 Picto 从 Figma 文件生成 Vue 图标组件，并提供在线预览。

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 拉取图标

```bash
pnpm pull
```

这将从 Figma 拉取图标并生成 Vue 组件到 `icons/` 目录。

### 3. 启动预览服务

```bash
pnpm dev
```

浏览器将自动打开预览页面，展示所有生成的图标组件。

## 功能特性

✨ **在线预览**
- 实时搜索图标
- 动态调整图标大小（16-64px）
- 响应式网格布局
- 悬停效果

🔧 **开发工具**
- Vite 开发服务器（热更新）
- TypeScript 支持
- Vue 3 Composition API

## 项目结构

```
demo-iconfont-vue/
├── icons/              # 生成的 Vue 图标组件
├── src/
│   ├── main.ts        # Vue 入口
│   ├── App.vue        # 主应用组件
│   └── index.css      # 全局样式
├── index.html         # HTML 模板
├── vite.config.ts     # Vite 配置
├── picto.config.ts    # Picto 配置
└── package.json
```

## 脚本命令

| 命令 | 说明 |
|------|------|
| `pnpm pull` | 从 Figma 拉取图标 |
| `pnpm watch` | 监听模式（自动重新生成） |
| `pnpm dev` | 启动 Vite 开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm preview` | 预览生产构建 |
| `pnpm clean` | 清理缓存 |

## 配置说明

### Picto 配置 (`picto.config.ts`)

```typescript
export default defineConfig({
  sources: [{
    type: 'figma',
    url: 'https://www.figma.com/file/...',
    token: 'your-figma-token',
    filters: {
      categories: ['insmind'],  // 只拉取特定分类
    },
  }],
  outputs: [{
    type: 'vue',
    dir: './icons',
  }],
  naming: {
    case: 'camel',  // 使用 camelCase 命名
  },
})
```

### Vite 配置 (`vite.config.ts`)

```typescript
export default defineConfig({
  plugins: [vue()],
  server: {
    open: true,  // 自动打开浏览器
  },
})
```

## 使用生成的图标

### 在 Vue 组件中使用

```vue
<template>
  <div>
    <Colordefault :width="24" :height="24" />
    <ThirdStatic :width="32" :height="32" />
  </div>
</template>

<script setup lang="ts">
import { Colordefault, ThirdStatic } from './icons'
</script>
```

### 动态导入

```vue
<template>
  <component :is="iconComponent" :width="24" :height="24" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import * as Icons from './icons'

const iconName = ref('Colordefault')
const iconComponent = computed(() => Icons[iconName.value])
</script>
```

## 技术栈

- **Vue 3**: 渐进式 JavaScript 框架
- **Vite**: 下一代前端工具
- **TypeScript**: JavaScript 超集
- **Picto**: 图标生成工具

## 注意事项

1. **Figma Token**: 需要在 `picto.config.ts` 中配置有效的 Figma Personal Access Token
2. **图标数量**: 当前配置过滤了 `insmind` 分类的图标
3. **命名规则**: 使用 `camelCase` 命名，如 `colorDefault`
4. **样式定制**: 可以通过 props 传递 `width`、`height`、`color` 等属性

## 开发说明

### 修改主题色

编辑 `src/index.css`，修改 `.icon-item:hover` 的颜色：

```css
.icon-item:hover .icon-preview svg {
  color: #42b883;  /* Vue 绿色 */
}
```

### 调整网格布局

在 `.icon-grid` 中修改：

```css
.icon-grid {
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 16px;
}
```

## 故障排除

### 图标未显示

1. 确保已运行 `pnpm pull` 生成图标
2. 检查 `icons/` 目录是否有 `.vue` 文件
3. 查看浏览器控制台是否有错误

### Vite 启动失败

1. 确保已安装依赖：`pnpm install`
2. 检查端口 5173 是否被占用
3. 删除 `node_modules` 重新安装

## 相关链接

- [Picto 文档](../../README.md)
- [Vue 3 文档](https://vuejs.org/)
- [Vite 文档](https://vitejs.dev/)

## License

MIT
