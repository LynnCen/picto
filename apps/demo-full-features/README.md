# Demo: Full Features Showcase

> 展示 Picto 的所有功能和高级配置选项

## 📝 功能展示

这个示例演示了 Picto 的完整功能集：

### 数据源
- ✅ Figma（带高级过滤）
- ✅ Iconfont（带 Unicode 过滤）
- ✅ 本地 SVG 文件

### 生成器
- ✅ React（TypeScript + React.memo）
- ✅ Vue 3（Composition API + TypeScript）
- ✅ Web Components（Shadow DOM）
- ✅ 优化的 SVG 文件
- ✅ JSON 元数据

### 高级功能
- ✅ 多数据源合并
- ✅ 命名规范转换
- ✅ SVG 优化（SVGO）
- ✅ 智能缓存
- ✅ 并发控制
- ✅ 错误重试

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
FIGMA_ACCESS_TOKEN=your_figma_token
ICONFONT_TOKEN=your_iconfont_token
```

### 3. 更新配置

编辑 `picto.config.ts`，替换为你的实际数据：

```typescript
sources: [
  {
    type: 'figma',
    url: 'YOUR_ACTUAL_URL',
    token: process.env.FIGMA_ACCESS_TOKEN,
  },
  // ... 其他源
]
```

### 4. 拉取图标

```bash
pnpm pull
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
├── svg/
│   ├── icon-add.svg
│   ├── icon-arrow-left.svg
│   └── icons.json
└── icons.json           # 完整元数据
```

## ⚙️ 配置详解

### 多数据源

```typescript
sources: [
  {
    type: 'figma',
    url: 'YOUR_URL',
    token: process.env.FIGMA_ACCESS_TOKEN,
    filters: {
      namePattern: /^icon-/,        // 仅包含以 icon- 开头的
      variants: ['24', 'filled'],   // 仅包含特定变体
      categories: ['actions'],      // 仅包含特定分类
    }
  },
  {
    type: 'iconfont',
    projectId: 'YOUR_ID',
    filters: {
      unicode: ['e600', 'e601'],    // 仅包含特定 Unicode
    }
  },
  {
    type: 'local',
    dir: './assets',
    pattern: '**/*.svg',
  }
]
```

### 命名规范

```typescript
naming: {
  case: 'pascal',                   // PascalCase
  prefix: 'Icon',                   // 添加前缀: IconArrowLeft
  removePrefix: ['ic_', 'icon_'],   // 移除源文件前缀
  removeSuffix: ['_24', '_filled'], // 移除源文件后缀
}
```

### SVG 优化

```typescript
optimization: {
  svgo: true,
  svgoConfig: {
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            removeViewBox: false,   // 保留 viewBox
          }
        }
      },
      'removeDimensions',           // 移除 width/height
    ]
  },
  removeComments: true,
  removeMetadata: true,
}
```

### 缓存配置

```typescript
cache: {
  enabled: true,
  dir: '.picto/cache',
  ttl: 3600,                        // 1 小时有效期
}
```

### 高级选项

```typescript
advanced: {
  concurrency: 5,                   // 最大并发请求数
  timeout: 30000,                   // 30 秒超时
  retry: 3,                         // 失败重试 3 次
  logLevel: 'info',                 // 日志级别
}
```

## 🎯 使用场景

### 场景 1：设计系统图标库

从 Figma 拉取完整的设计系统图标，生成多框架组件。

### 场景 2：第三方图标整合

整合 Iconfont 和本地 SVG，统一管理。

### 场景 3：渐进式迁移

逐步将旧的图标系统迁移到 Picto。

## 💡 最佳实践

1. **使用缓存**：启用缓存可以大幅提升重复构建速度
2. **合理设置并发**：根据 API 限制调整 `concurrency`
3. **命名规范一致**：使用 `naming` 配置统一命名风格
4. **选择性生成**：只生成需要的框架组件，节省时间
5. **版本控制**：提交配置文件，忽略生成的图标文件（或根据需求决定）

## 🔗 相关资源

- [Picto 完整文档](../../docs)
- [配置参考](../../docs/api/configuration.md)
- [插件开发](../../docs/guide/plugin-development.md)

## 📚 其他示例

- [Figma → React](../demo-figma-react) - 基础 Figma 集成
- [Iconfont → Vue](../demo-iconfont-vue) - 基础 Iconfont 集成
- [本地 SVG](../demo-local-svg) - 本地文件扫描
