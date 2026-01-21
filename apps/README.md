# Picto Apps & Demos

> Picto 的应用和示例集合

## 📁 目录结构

```
apps/
├── playground/              # 🔧 开发测试沙盒
├── demo-figma-react/       # 📚 示例：Figma → React
├── demo-iconfont-vue/      # 📚 示例：Iconfont → Vue
├── demo-local-svg/         # 📚 示例：本地 SVG → 多框架
└── demo-full-features/     # 📚 示例：完整功能展示
```

## 🎯 用途说明

### Playground（开发测试）

**用途**：日常开发和快速测试

- ❌ **不提交**生成的图标文件
- ❌ **不提交**配置文件
- ✅ 用于快速验证功能
- ✅ 用于调试和实验

**使用方法**：

```bash
cd playground
pnpm install
pnpm init          # 生成配置文件
# 编辑 picto.config.ts
pnpm pull          # 或 pnpm dev
```

---

### Demos（官方示例）

**用途**：作为官方示例和教程代码

- ✅ **提交**生成的图标文件（供用户参考）
- ✅ **提交**配置文件
- ✅ 作为文档的代码示例
- ✅ 用户可以直接运行

---

## 📚 示例列表

### 1. [demo-figma-react](./demo-figma-react)

> **从 Figma 拉取图标并生成 React 组件**

**适用场景**：
- 设计团队使用 Figma 管理图标
- 需要生成 React/TypeScript 组件
- 需要保持设计和代码同步

**特性**：
- ✅ Figma API 集成
- ✅ TypeScript + React.memo
- ✅ 自动命名规范
- ✅ SVG 优化

**快速开始**：
```bash
cd demo-figma-react
pnpm install
# 配置 FIGMA_ACCESS_TOKEN
pnpm pull
```

---

### 2. [demo-iconfont-vue](./demo-iconfont-vue)

> **从 Iconfont 拉取图标并生成 Vue 3 组件**

**适用场景**：
- 使用阿里巴巴 Iconfont 平台
- Vue 3 项目
- 需要 Composition API 组件

**特性**：
- ✅ Iconfont CSS 解析
- ✅ Vue 3 Composition API
- ✅ TypeScript 支持
- ✅ 自动优化

**快速开始**：
```bash
cd demo-iconfont-vue
pnpm install
# 配置 projectId 和 cssUrl
pnpm pull
```

---

### 3. [demo-local-svg](./demo-local-svg)

> **扫描本地 SVG 文件并生成多框架组件**

**适用场景**：
- 已有 SVG 图标库
- 需要生成多个框架的组件
- 不依赖外部服务

**特性**：
- ✅ 本地文件扫描
- ✅ 同时生成 React、Vue、Web Components
- ✅ 目录分类
- ✅ Watch 模式

**快速开始**：
```bash
cd demo-local-svg
pnpm install
# 将 SVG 文件放入 assets/icons/
pnpm pull
```

**包含示例 SVG**：
- ✅ `actions/add.svg`
- ✅ `actions/check.svg`
- ✅ `arrows/arrow-left.svg`

---

### 4. [demo-full-features](./demo-full-features)

> **完整功能和高级配置展示**

**适用场景**：
- 需要了解所有配置选项
- 复杂的多源集成
- 高级定制需求

**特性**：
- ✅ 多数据源（Figma + Iconfont + Local）
- ✅ 所有生成器类型
- ✅ 高级过滤和命名
- ✅ 自定义 SVGO 配置
- ✅ 缓存和性能优化

**快速开始**：
```bash
cd demo-full-features
pnpm install
# 配置所有环境变量
pnpm pull
```

---

## 🚀 统一安装

从项目根目录安装所有应用：

```bash
pnpm install
```

## 📖 相关文档

- [快速开始](../docs/guide/getting-started.md)
- [配置参考](../docs/api/configuration.md)
- [CLI 命令](../docs/guide/cli-commands.md)
- [插件开发](../docs/guide/plugin-development.md)

## 🤝 贡献

欢迎提交更多示例！请参考现有示例的结构和文档风格。

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE)
