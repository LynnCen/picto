# Demo: Figma to React Components

> 演示如何从 Figma 拉取图标并生成 React 组件

## 📝 功能展示

- ✅ 从 Figma 拉取图标
- ✅ 生成 TypeScript React 组件
- ✅ 使用 React.memo 优化性能
- ✅ 自动应用命名规范（PascalCase + Icon 前缀）
- ✅ SVG 优化
- ✅ Vite + React 在线预览
- ✅ 图标搜索和大小调节
- ✅ 完整的 TypeScript 配置

## 🚀 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置 Figma Token

在项目根目录创建 `.env` 文件：

```env
FIGMA_ACCESS_TOKEN=your_figma_token_here
```

或者直接导出环境变量：

```bash
export FIGMA_ACCESS_TOKEN=your_token
```

### 3. 更新配置文件

编辑 `picto.config.ts`，将 Figma URL 替换为你的文件：

```typescript
url: 'https://www.figma.com/file/YOUR_FILE_KEY/Your-Icon-Library'
```

### 4. 拉取图标

```bash
# 一次性拉取
pnpm pull

# 或使用 watch 模式（Picto CLI）
pnpm watch
```

### 5. 预览图标

启动开发服务器，在线预览生成的图标：

```bash
pnpm dev
```

访问 `http://localhost:3000/` 即可看到：
- 🔍 图标搜索功能
- 📏 实时调整图标大小（16px - 64px）
- 🎨 极简优雅的 UI 界面
- 📱 响应式设计

## 📂 项目文件结构

```
demo-figma-react/
├── src/
│   ├── App.tsx            # 主应用（图标预览界面）
│   ├── App.css            # 应用样式
│   ├── main.tsx           # React 入口
│   ├── index.css          # 全局样式
│   └── vite-env.d.ts      # Vite 类型声明
├── icons/                 # 生成的图标组件
│   ├── Icon*.tsx          # 1189+ 个 React 组件
│   ├── index.ts           # 统一导出
│   └── types.ts           # TypeScript 类型
├── tsconfig.json          # TypeScript 主配置
├── tsconfig.node.json     # Node 环境配置
├── vite.config.ts         # Vite 配置
├── picto.config.ts        # Picto 配置
└── index.html             # HTML 入口
```

## ⚙️ TypeScript 配置

通过 `extends` 继承根目录配置，并添加 React 支持：
- ✅ 继承 `../../tsconfig.json` 基础配置
- ✅ `jsx: "react-jsx"` - React 17+ JSX 转换
- ✅ `lib: ["ES2022", "DOM", "DOM.Iterable"]` - DOM API 类型

如需重启 TS 服务器：`Cmd+Shift+P` → `TypeScript: Restart TS Server`

## 💻 使用生成的组件

```tsx
import { IconArrowLeft, IconCheck } from './icons'

function App() {
  return (
    <div>
      <IconArrowLeft width={24} height={24} />
      <IconCheck className="text-green-500" />
    </div>
  )
}
```

## ⚙️ 配置说明

### 源配置

```typescript
sources: [
  {
    type: 'figma',
    url: 'YOUR_FIGMA_URL',
    token: process.env.FIGMA_ACCESS_TOKEN,
    includeComponents: true,    // 包含 Component
    includeInstances: false,    // 不包含 Instance
  }
]
```

### 输出配置

```typescript
outputs: [
  {
    type: 'react',
    dir: './icons',
    options: {
      typescript: true,         // 生成 TypeScript 文件
      memo: true,               // 使用 React.memo 包装
    }
  }
]
```

### 命名配置

```typescript
naming: {
  case: 'pascal',               // PascalCase
  prefix: 'Icon',               // 添加前缀
}
```

## 🔗 相关资源

- [Figma API 文档](https://www.figma.com/developers/api)
- [如何获取 Figma Token](https://help.figma.com/hc/en-us/articles/8085703771159)
- [Picto 完整文档](../../docs)

## 📚 更多示例

- [Iconfont → Vue](../demo-iconfont-vue)
- [本地 SVG → 多框架](../demo-local-svg)
- [完整功能演示](../demo-full-features)
