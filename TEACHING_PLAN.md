# Picto CLI - 教学文档规划

> **文档性质**: 教学任务规划文档  
> **目标读者**: 教学团队、内容创作者、学习者  
> **文档版本**: v1.0.0  
> **最后更新**: 2026-01-20

---

## 📚 教学文档总体规划

### 教学目标

通过循序渐进的教学方式,帮助学习者:
1. **理解** Picto的设计思想和架构原理
2. **掌握** TypeScript CLI工具开发的最佳实践
3. **实践** 从零开始构建一个完整的CLI工具
4. **扩展** 能够基于Picto开发自定义插件

### 教学原则

- **循序渐进**: 从简单到复杂,逐步深入
- **理论结合实践**: 每个概念都配合实际代码
- **问题驱动**: 以解决实际问题为导向
- **可复现**: 每个步骤都能独立复现

---

## Phase 0 教学文档: 项目初始化与工程化 (Week 1)

### 文档标题: "从零搭建现代化TypeScript Monorepo"

#### 学习目标

- 理解Monorepo的优势和适用场景
- 掌握pnpm workspace配置
- 掌握TypeScript项目配置
- 理解现代化构建工具的选择

#### 教学大纲

**第1课: 为什么选择Monorepo?**

```markdown
# 课程内容
1. 传统多仓库的痛点
   - 依赖管理复杂
   - 版本同步困难
   - 代码复用低效

2. Monorepo的优势
   - 统一的依赖管理
   - 便捷的代码共享
   - 原子化的提交

3. Monorepo工具对比
   - Lerna vs Turborepo vs pnpm workspace
   - 为什么选择pnpm + Turborepo

# 实践任务
创建基础的Monorepo结构
```

**第2课: TypeScript配置详解**

```markdown
# 课程内容
1. TypeScript编译选项解析
   - target vs module
   - moduleResolution策略
   - path mapping配置

2. Project References
   - 为什么需要Project References
   - 如何配置多包引用
   - 增量编译原理

# 实践任务
配置packages/core和packages/cli的TypeScript
```

**第3课: 现代化构建工具: tsup**

```markdown
# 课程内容
1. 为什么不用tsc?
   - tsc性能问题
   - 缺少bundle能力

2. tsup的优势
   - 基于esbuild,速度极快
   - 零配置,开箱即用
   - 自动生成类型声明

3. 配置ESM + CJS双格式输出

# 实践任务
为core包配置tsup,实现快速构建
```

**第4课: 代码质量工具链**

```markdown
# 课程内容
1. ESLint配置
   - 推荐的TypeScript规则
   - 自定义规则

2. Prettier配置
   - 与ESLint的协作
   - 团队统一风格

3. Git Hooks
   - husky配置
   - lint-staged自动格式化
   - commitlint规范提交

# 实践任务
完整的质量工具链搭建
```

**第5课: CI/CD自动化**

```markdown
# 课程内容
1. GitHub Actions基础
2. 配置自动化测试流程
3. 配置自动化发布流程
4. 跨平台测试(Ubuntu/macOS/Windows)

# 实践任务
编写第一个GitHub Actions workflow
```

#### 交付物

- ✅ 5篇详细教学文章
- ✅ 配套的代码示例仓库(每课一个分支)
- ✅ 配套的视频教程(可选)
- ✅ 课后练习题

---

## Phase 1 教学文档: MVP核心功能开发 (Week 2-9)

### Sprint 1-2 教学文档: CLI框架与配置系统

#### 文档1: "使用CAC构建专业CLI工具"

**学习目标**: 掌握CLI框架的使用,理解命令行工具的架构设计

**教学大纲**:

```markdown
# 第1节: CLI工具的核心要素
1. 命令(Commands)
2. 参数(Options/Flags)
3. 位置参数(Positional Arguments)
4. 帮助文档(Help)

# 第2节: CAC框架入门
1. 为什么选择CAC?
2. 基础命令定义
3. 参数验证
4. 错误处理

# 实战: 实现picto init命令

步骤1: 安装依赖
```bash
pnpm add cac
```

步骤2: 创建CLI入口
```typescript
// packages/cli/src/index.ts
import { cac } from 'cac'

const cli = cac('picto')

cli
  .command('init', 'Initialize picto configuration')
  .action(async () => {
    console.log('Initializing...')
  })

cli.help()
cli.version('0.1.0')
cli.parse()
```

步骤3: 添加可执行文件
```javascript
// packages/cli/bin/picto.js
#!/usr/bin/env node
require('../dist/index.js')
```

步骤4: 测试命令
```bash
node bin/picto.js init
node bin/picto.js --help
```

# 第3节: 美化输出
1. 使用chalk添加颜色
2. 使用ora显示加载动画
3. 使用consola统一日志格式

# 课后练习
1. 为init命令添加--force参数
2. 实现交互式问答(使用prompts)
3. 美化所有输出信息
```

#### 文档2: "使用Zod构建类型安全的配置系统"

**学习目标**: 理解配置系统的设计,掌握Zod进行运行时验证

**教学大纲**:

```markdown
# 第1节: 配置系统的设计原则
1. 多层级配置
   - 默认配置
   - 配置文件
   - CLI参数
2. 配置优先级
3. 配置验证

# 第2节: Zod入门
1. 为什么选择Zod?
   - 类型推导
   - 友好的错误提示
2. 基础Schema定义
3. 复杂Schema组合

# 实战: 实现Picto配置系统

步骤1: 定义配置Schema
```typescript
// packages/core/src/config/schema.ts
import { z } from 'zod'

export const SourceConfigSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('figma'),
    url: z.string().url(),
    token: z.string().min(1)
  }),
  z.object({
    type: z.literal('local'),
    dir: z.string(),
    pattern: z.string().default('**/*.svg')
  })
])

export const ConfigSchema = z.object({
  sources: z.array(SourceConfigSchema),
  outputs: z.array(z.object({
    type: z.enum(['svg', 'react', 'vue']),
    dir: z.string()
  }))
})

export type Config = z.infer<typeof ConfigSchema>
```

步骤2: 实现配置加载器
```typescript
// packages/core/src/config/loader.ts
export async function loadConfig(path?: string): Promise<Config> {
  // 1. 查找配置文件
  const configPath = path || await findConfigFile()
  
  // 2. 加载配置
  const userConfig = await loadConfigFile(configPath)
  
  // 3. 合并默认配置
  const merged = defu(userConfig, defaultConfig)
  
  // 4. 验证配置
  const result = ConfigSchema.safeParse(merged)
  if (!result.success) {
    throw new ConfigValidationError(result.error)
  }
  
  return result.data
}
```

步骤3: 支持TypeScript配置文件
```typescript
// 使用jiti动态加载TS文件
import { createJiti } from 'jiti'

const jiti = createJiti(__filename)
const config = jiti('./picto.config.ts')
```

# 第3节: 配置文件查找策略
1. cosmiconfig的工作原理
2. 支持多种配置文件格式

# 课后练习
1. 添加配置验证的详细错误提示
2. 支持YAML格式配置文件
3. 实现配置文件初始化向导
```

### Sprint 3-4 教学文档: Figma API集成

#### 文档3: "深入理解Figma REST API"

**学习目标**: 掌握Figma API的使用,理解文档树遍历算法

**教学大纲**:

```markdown
# 第1节: Figma API概述
1. 认证方式(Personal Access Token)
2. API端点说明
3. 速率限制

# 第2节: 核心API详解

## GET /v1/files/:file_key
获取Figma文件的完整文档树

请求示例:
```typescript
const response = await ofetch(
  `https://api.figma.com/v1/files/${fileKey}`,
  {
    headers: {
      'X-Figma-Token': token
    }
  }
)
```

响应结构:
```json
{
  "document": {
    "id": "0:0",
    "name": "Document",
    "type": "DOCUMENT",
    "children": [...]
  }
}
```

## GET /v1/images/:file_key
导出节点为SVG

# 第3节: 实战 - 实现Figma Source Plugin

步骤1: 创建FigmaClient
```typescript
// packages/core/src/plugins/sources/figma/client.ts
export class FigmaClient {
  constructor(private token: string) {}
  
  async getFile(fileKey: string) {
    return ofetch(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { 'X-Figma-Token': this.token },
      retry: 3,
      timeout: 30000
    })
  }
  
  async exportNodes(fileKey: string, nodeIds: string[]) {
    const params = new URLSearchParams({
      ids: nodeIds.join(','),
      format: 'svg'
    })
    
    return ofetch(
      `https://api.figma.com/v1/images/${fileKey}?${params}`,
      {
        headers: { 'X-Figma-Token': this.token }
      }
    )
  }
}
```

步骤2: 实现文档树遍历
```typescript
// 递归遍历找到所有COMPONENT节点
function traverseNode(
  node: FigmaNode,
  filter: (node: FigmaNode) => boolean
): FigmaNode[] {
  const results: FigmaNode[] = []
  
  if (filter(node)) {
    results.push(node)
  }
  
  if ('children' in node && node.children) {
    for (const child of node.children) {
      results.push(...traverseNode(child, filter))
    }
  }
  
  return results
}

// 使用
const components = traverseNode(document, node => 
  node.type === 'COMPONENT' && node.name.startsWith('icon-')
)
```

步骤3: 实现批量SVG下载
```typescript
async function fetchSVGs(
  client: FigmaClient,
  fileKey: string,
  nodes: FigmaNode[]
): Promise<Map<string, string>> {
  // 1. 获取SVG下载链接
  const response = await client.exportNodes(
    fileKey,
    nodes.map(n => n.id)
  )
  
  // 2. 并发下载SVG内容
  const BATCH_SIZE = 10
  const results = new Map<string, string>()
  
  for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
    const batch = nodes.slice(i, i + BATCH_SIZE)
    const svgs = await Promise.all(
      batch.map(async node => {
        const url = response.images[node.id]
        const svg = await ofetch(url)
        return { id: node.id, svg }
      })
    )
    
    svgs.forEach(({ id, svg }) => results.set(id, svg))
  }
  
  return results
}
```

# 第4节: 错误处理与重试
1. API限流处理
2. 网络错误重试
3. 友好的错误提示

# 课后练习
1. 实现COMPONENT_SET的支持
2. 添加进度显示
3. 实现SVG下载缓存
```

### Sprint 5-6 教学文档: 代码生成器

#### 文档4: "使用Template Strings和Prettier构建代码生成器"

**学习目标**: 掌握原生Template Strings代码生成,理解代码质量保证的最佳实践

**教学大纲**:

```markdown
# 第1节: 代码生成器的设计理念
1. 为什么选择Template Strings?
   - 原生语言特性,零依赖
   - 完美的类型安全
   - IDE支持好,易于调试
2. Template Strings vs 模板引擎
3. 可扩展的生成器架构

# 第2节: Template Strings核心技巧
1. 多行字符串处理
2. 表达式嵌入
3. 条件逻辑处理
4. 可读性优化

# 第3节: 实战 - React组件生成器

步骤1: 设计生成函数
```typescript
// packages/core/src/plugins/generators/react.ts
import prettier from 'prettier'
import { toPascalCase } from '../../utils/naming'

export class ReactGeneratorPlugin implements GeneratorPlugin {
  name = 'react'
  type = 'generator' as const
  
  async generate(icons: IconMetadata[], config: ReactOutputConfig) {
    for (const icon of icons) {
      const code = await this.renderComponent(icon, config)
      const fileName = `${icon.name}.tsx`
      await fs.writeFile(
        path.join(config.dir, fileName),
        code
      )
    }
    
    await this.generateIndex(icons, config)
  }
  
  private async renderComponent(
    icon: IconMetadata,
    config: ReactOutputConfig
  ): Promise<string> {
    const componentName = toPascalCase(icon.name)
    const svgContent = this.cleanSVGContent(icon.svg.content)
    const defaultSize = config.defaultProps?.size || 24
    const defaultColor = config.defaultProps?.color || 'currentColor'
    const useMemo = config.memo !== false
    
    // 使用Template Strings生成代码
    const code = `
import React from 'react';

export interface ${componentName}Props extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  color?: string;
}

${useMemo ? `export const ${componentName}: React.FC<${componentName}Props> = React.memo(({` : `export const ${componentName}: React.FC<${componentName}Props> = ({`}
  size = ${defaultSize},
  color = '${defaultColor}',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="${icon.svg.viewBox}"
      fill="none"
      {...props}
    >
      ${svgContent}
    </svg>
  );
}${useMemo ? ')' : ''};

${componentName}.displayName = '${componentName}';
`
    
    // 使用Prettier格式化代码
    return prettier.format(code, {
      parser: 'typescript',
      semi: false,
      singleQuote: true,
      trailingComma: 'es5'
    })
  }
  
  private cleanSVGContent(content: string): string {
    // 移除<svg>标签,只保留内部内容
    return content
      .replace(/<svg[^>]*>/, '')
      .replace(/<\/svg>/, '')
      .trim()
  }
  
  private async generateIndex(icons: IconMetadata[], config: ReactOutputConfig) {
    const exports = icons
      .map(icon => {
        const name = toPascalCase(icon.name)
        return `export { ${name} } from './${icon.name}'`
      })
      .join('\n')
    
    const formatted = await prettier.format(exports, {
      parser: 'typescript'
    })
    
    await fs.writeFile(
      path.join(config.dir, 'index.ts'),
      formatted
    )
  }
}
```

步骤2: Template Strings最佳实践
```typescript
// ✅ 好的实践: 先准备数据,再生成代码
const data = {
  componentName: toPascalCase(icon.name),
  imports: ['React'],
  props: ['size', 'color'],
  defaultSize: 24
}

const code = `
import ${data.imports.join(', ')} from 'react';

export const ${data.componentName} = ...
`

// ❌ 避免: 在模板中写复杂逻辑
const code = `
import ${icon.name.split('-').map(s => s[0].toUpperCase() + s.slice(1)).join('')} from 'react';
`
```

步骤3: 处理条件逻辑
```typescript
// 技巧1: 使用三元运算符
const code = `
${useMemo ? 'export const Foo = React.memo((...) => {...})' : 'export const Foo = (...) => {...}'}
`

// 技巧2: 使用函数抽取复杂逻辑
function generatePropsInterface(props: PropDef[]): string {
  return props.map(p => `  ${p.name}?: ${p.type}`).join('\n')
}

const code = `
export interface FooProps {
${generatePropsInterface(props)}
}
`

// 技巧3: 使用数组join
const exports = icons.map(i => `export { ${i.name} } from './${i.file}'`).join('\n')
```

# 第4节: Prettier集成 - 保证代码质量
1. 为什么需要Prettier?
   - 自动格式化,统一代码风格
   - 处理缩进、换行等细节
   - 团队协作的最佳实践

2. Prettier配置
```typescript
const prettierConfig = {
  parser: 'typescript',  // 根据生成的代码类型选择
  semi: false,           // 是否添加分号
  singleQuote: true,     // 使用单引号
  trailingComma: 'es5',  // 尾随逗号
  printWidth: 100,       // 行宽
  tabWidth: 2            // 缩进
}

const formatted = await prettier.format(code, prettierConfig)
```

3. 错误处理
```typescript
async function formatCode(code: string): Promise<string> {
  try {
    return await prettier.format(code, { parser: 'typescript' })
  } catch (error) {
    logger.error('Failed to format code:', error)
    // 返回未格式化的代码,而不是失败
    return code
  }
}
```

# 第5节: Vue生成器实现
1. Vue 3 Composition API
2. TypeScript支持
3. Props定义

```typescript
private async renderVueComponent(icon: IconMetadata): Promise<string> {
  const componentName = toPascalCase(icon.name)
  
  const code = `
<script setup lang="ts">
interface Props {
  size?: number | string
  color?: string
}

withDefaults(defineProps<Props>(), {
  size: 24,
  color: 'currentColor'
})
</script>

<template>
  <svg :width="size" :height="size" viewBox="${icon.svg.viewBox}">
    ${icon.svg.content}
  </svg>
</template>
`
  
  return prettier.format(code, { parser: 'vue' })
}
```

# 课后练习
1. 实现Svelte生成器
2. 为React组件添加JSDoc注释生成
3. 实现代码生成的单元测试
4. 支持自定义Prettier配置
```

### Sprint 7-8 教学文档: 测试与文档

#### 文档5: "使用Vitest构建完整的测试体系"

**学习目标**: 掌握现代化测试框架,理解测试金字塔

**教学大纲**:

```markdown
# 第1节: 测试策略
1. 测试金字塔
   - 70% 单元测试
   - 20% 集成测试
   - 10% E2E测试

2. 测试驱动开发(TDD)
3. 测试覆盖率目标

# 第2节: Vitest入门
1. 为什么选择Vitest?
   - 极快的速度
   - 兼容Jest API
   - 原生ESM支持

2. 基础测试编写
3. Mock和Spy

# 第3节: 实战 - 单元测试

测试工具函数:
```typescript
// packages/core/src/utils/naming.test.ts
import { describe, it, expect } from 'vitest'
import { toPascalCase, toKebabCase, formatIconName } from './naming'

describe('naming utils', () => {
  describe('toPascalCase', () => {
    it('should convert kebab-case to PascalCase', () => {
      expect(toPascalCase('icon-arrow-left')).toBe('IconArrowLeft')
    })
    
    it('should convert snake_case to PascalCase', () => {
      expect(toPascalCase('icon_arrow_left')).toBe('IconArrowLeft')
    })
    
    it('should handle already PascalCase strings', () => {
      expect(toPascalCase('IconArrowLeft')).toBe('IconArrowLeft')
    })
  })
  
  describe('formatIconName', () => {
    it('should apply prefix', () => {
      expect(formatIconName('arrow-left', { prefix: 'icon' }))
        .toBe('icon-arrow-left')
    })
    
    it('should remove prefix', () => {
      expect(formatIconName('ic_arrow_left', { removePrefix: ['ic_'] }))
        .toBe('arrow-left')
    })
    
    it('should convert case', () => {
      expect(formatIconName('ArrowLeft', { case: 'kebab' }))
        .toBe('arrow-left')
    })
  })
})
```

测试配置加载:
```typescript
// packages/core/src/config/loader.test.ts
import { describe, it, expect, vi } from 'vitest'
import { loadConfig } from './loader'

describe('Config Loader', () => {
  it('should load valid config file', async () => {
    const config = await loadConfig('./fixtures/valid.config.ts')
    
    expect(config).toMatchObject({
      sources: expect.arrayContaining([
        expect.objectContaining({ type: 'figma' })
      ]),
      outputs: expect.any(Array)
    })
  })
  
  it('should throw on invalid config', async () => {
    await expect(
      loadConfig('./fixtures/invalid.config.ts')
    ).rejects.toThrow('Configuration validation failed')
  })
  
  it('should merge with default config', async () => {
    const config = await loadConfig('./fixtures/minimal.config.ts')
    
    expect(config.naming.case).toBe('kebab') // default value
  })
})
```

# 第4节: 集成测试

测试完整流程:
```typescript
// packages/core/tests/integration/figma-to-react.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PictoEngine } from '../../src/engine/Engine'
import { setupMockFigmaAPI } from '../helpers/figma-mock'
import fs from 'fs-extra'

describe('Figma to React Integration', () => {
  const outputDir = './test-output'
  
  beforeEach(async () => {
    setupMockFigmaAPI()
    await fs.ensureDir(outputDir)
  })
  
  afterEach(async () => {
    await fs.remove(outputDir)
  })
  
  it('should generate React components from Figma', async () => {
    const engine = new PictoEngine({
      sources: [{
        type: 'figma',
        url: 'https://figma.com/file/test123',
        token: 'test-token'
      }],
      outputs: [{
        type: 'react',
        dir: outputDir
      }]
    })
    
    await engine.run()
    
    // 验证生成的文件
    const files = await fs.readdir(outputDir)
    expect(files).toContain('icon-arrow-left.tsx')
    expect(files).toContain('icon-arrow-right.tsx')
    expect(files).toContain('index.ts')
    
    // 验证文件内容
    const content = await fs.readFile(
      `${outputDir}/icon-arrow-left.tsx`,
      'utf-8'
    )
    expect(content).toContain('export const IconArrowLeft')
    expect(content).toContain('React.FC')
  })
})
```

# 第5节: Mock最佳实践
1. Mock HTTP请求
2. Mock文件系统
3. Mock环境变量

# 课后练习
1. 为所有核心函数编写单元测试
2. 编写CLI命令的集成测试
3. 使用测试覆盖率工具优化测试
```

---

## Phase 2 教学文档: 功能完善与性能优化 (Week 10-21)

### 文档6: "实现智能缓存系统"

**学习目标**: 理解缓存策略,掌握性能优化技巧

**教学大纲**:

```markdown
# 第1节: 为什么需要缓存?
1. 避免重复的网络请求
2. 加快增量更新速度
3. 提升开发体验

# 第2节: 缓存策略设计
1. 基于内容哈希的缓存key
2. TTL(Time To Live)过期机制
3. 缓存失效策略

# 第3节: 实战 - 实现CacheManager

```typescript
// packages/core/src/cache/CacheManager.ts
import crypto from 'node:crypto'
import fs from 'fs-extra'
import path from 'node:path'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

export class CacheManager {
  constructor(
    private cacheDir: string,
    private defaultTTL: number = 86400 // 24小时
  ) {}
  
  async get<T>(key: string): Promise<T | null> {
    const cachePath = this.getCachePath(key)
    
    if (!await fs.pathExists(cachePath)) {
      return null
    }
    
    const entry: CacheEntry<T> = await fs.readJSON(cachePath)
    
    if (this.isExpired(entry)) {
      await fs.remove(cachePath)
      return null
    }
    
    return entry.data
  }
  
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const cachePath = this.getCachePath(key)
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    }
    
    await fs.outputJSON(cachePath, entry)
  }
  
  async has(key: string): Promise<boolean> {
    return this.get(key) !== null
  }
  
  async delete(key: string): Promise<void> {
    const cachePath = this.getCachePath(key)
    await fs.remove(cachePath)
  }
  
  async clear(): Promise<void> {
    await fs.emptyDir(this.cacheDir)
  }
  
  // 生成缓存key
  generateKey(data: any): string {
    const hash = crypto.createHash('md5')
    hash.update(JSON.stringify(data))
    return hash.digest('hex')
  }
  
  private getCachePath(key: string): string {
    return path.join(this.cacheDir, `${key}.json`)
  }
  
  private isExpired(entry: CacheEntry<any>): boolean {
    const age = (Date.now() - entry.timestamp) / 1000
    return age > entry.ttl
  }
}
```

# 第4节: 在Figma插件中使用缓存

```typescript
// 缓存Figma文件数据
async fetch(config: FigmaSourceConfig): Promise<RawIconData[]> {
  const cacheKey = this.cache.generateKey({
    type: 'figma-file',
    fileKey: this.extractFileKey(config.url)
  })
  
  // 尝试从缓存读取
  const cached = await this.cache.get<FigmaFile>(cacheKey)
  if (cached) {
    this.logger.info('Using cached Figma file data')
    return this.processFile(cached)
  }
  
  // 缓存未命中,从API获取
  const file = await this.client.getFile(fileKey, config.token)
  
  // 写入缓存
  await this.cache.set(cacheKey, file, 3600) // 1小时
  
  return this.processFile(file)
}
```

# 第5节: 性能监控
1. 缓存命中率统计
2. 性能指标收集
3. 优化建议

# 课后练习
1. 实现LRU缓存策略
2. 添加缓存大小限制
3. 实现缓存预热机制
```

### 文档7: "实现Watch模式和增量更新"

**学习目标**: 掌握文件监听,理解增量更新算法

**教学大纲**:

```markdown
# 第1节: Watch模式的实现原理
1. 文件系统监听
2. 去抖动(Debounce)
3. 变更检测

# 第2节: 使用chokidar监听文件

```typescript
// packages/cli/src/commands/dev.ts
import chokidar from 'chokidar'

export async function devCommand(options: DevOptions) {
  const engine = new PictoEngine(options.config)
  
  // 初始构建
  await engine.run()
  
  if (!options.watch) {
    return
  }
  
  // 监听配置文件变化
  const watcher = chokidar.watch(options.config.sources.map(s => {
    if (s.type === 'local') {
      return s.dir
    }
    return null
  }).filter(Boolean), {
    ignored: /node_modules/,
    persistent: true
  })
  
  // 去抖动处理
  let timeoutId: NodeJS.Timeout
  
  watcher.on('all', (event, path) => {
    clearTimeout(timeoutId)
    
    timeoutId = setTimeout(async () => {
      console.log(`File ${event}: ${path}`)
      console.log('Rebuilding...')
      
      await engine.run()
      
      console.log('✓ Build complete')
    }, 300)
  })
  
  console.log('Watching for changes...')
}
```

# 第3节: 增量更新算法

```typescript
// 检测图标变更
export async function detectChanges(
  oldIcons: IconMetadata[],
  newIcons: IconMetadata[]
): Promise<IconChanges> {
  const oldMap = new Map(oldIcons.map(i => [i.id, i]))
  const newMap = new Map(newIcons.map(i => [i.id, i]))
  
  const added: IconMetadata[] = []
  const removed: IconMetadata[] = []
  const updated: IconMetadata[] = []
  const unchanged: IconMetadata[] = []
  
  // 检查新增和更新
  for (const [id, newIcon] of newMap) {
    const oldIcon = oldMap.get(id)
    
    if (!oldIcon) {
      added.push(newIcon)
    } else if (oldIcon._hash !== newIcon._hash) {
      updated.push(newIcon)
    } else {
      unchanged.push(newIcon)
    }
  }
  
  // 检查删除
  for (const [id, oldIcon] of oldMap) {
    if (!newMap.has(id)) {
      removed.push(oldIcon)
    }
  }
  
  return { added, removed, updated, unchanged }
}

// 增量生成
export async function incrementalGenerate(
  changes: IconChanges,
  generator: GeneratorPlugin
) {
  // 只处理新增和更新的图标
  const iconsToGenerate = [...changes.added, ...changes.updated]
  
  if (iconsToGenerate.length === 0) {
    console.log('No changes detected')
    return
  }
  
  console.log(`Generating ${iconsToGenerate.length} icons...`)
  await generator.generate(iconsToGenerate, config)
  
  // 删除已移除的图标文件
  for (const icon of changes.removed) {
    await fs.remove(`${config.dir}/${icon.name}.tsx`)
  }
  
  // 重新生成index.ts(包含所有图标)
  await generator.generateIndex(
    [...changes.unchanged, ...iconsToGenerate],
    config
  )
}
```

# 课后练习
1. 优化去抖动策略
2. 添加热重载支持
3. 实现变更通知(桌面通知)
```

---

## Phase 3 教学文档: 插件生态与高级特性 (Week 22-45)

### 文档8: "构建可扩展的插件系统"

**学习目标**: 理解插件架构,掌握插件开发

**教学大纲**:

```markdown
# 第1节: 插件系统设计原则
1. 关注点分离
2. 开闭原则
3. 依赖注入

# 第2节: 插件生命周期

```typescript
// 插件生命周期钩子
interface PluginHooks {
  // 初始化阶段
  'before:setup'?: (context: PluginContext) => void | Promise<void>
  'after:setup'?: (context: PluginContext) => void | Promise<void>
  
  // 数据拉取阶段
  'before:fetch'?: (config: SourceConfig) => void | Promise<void>
  'after:fetch'?: (data: RawIconData[]) => void | Promise<void>
  
  // 数据处理阶段
  'before:process'?: (data: IconMetadata[]) => void | Promise<void>
  'after:process'?: (data: IconMetadata[]) => void | Promise<void>
  
  // 代码生成阶段
  'before:generate'?: (data: IconMetadata[]) => void | Promise<void>
  'after:generate'?: (files: string[]) => void | Promise<void>
  
  // 错误处理
  'error'?: (error: Error) => void
  
  // 清理阶段
  'teardown'?: () => void | Promise<void>
}
```

# 第3节: 实战 - 开发自定义插件

开发一个图标压缩插件:
```typescript
// my-compress-plugin.ts
import { ProcessorPlugin, IconMetadata, PluginContext } from '@picto/core'
import imagemin from 'imagemin'
import imageminSvgo from 'imagemin-svgo'

export class CompressPlugin implements ProcessorPlugin {
  name = 'compress'
  version = '1.0.0'
  type = 'processor' as const
  
  private context: PluginContext
  
  async setup(context: PluginContext) {
    this.context = context
    this.context.logger.info('Compress plugin initialized')
  }
  
  async process(icons: IconMetadata[]): Promise<IconMetadata[]> {
    this.context.logger.info(`Compressing ${icons.length} icons...`)
    
    const compressed = await Promise.all(
      icons.map(async icon => {
        const optimized = await this.compressSVG(icon.svg.content)
        
        return {
          ...icon,
          svg: {
            ...icon.svg,
            optimized
          }
        }
      })
    )
    
    this.context.logger.success('Compression complete')
    return compressed
  }
  
  private async compressSVG(svg: string): Promise<string> {
    const buffer = Buffer.from(svg)
    const result = await imagemin.buffer(buffer, {
      plugins: [
        imageminSvgo({
          plugins: [
            { removeViewBox: false },
            { removeTitle: true },
            { removeDesc: true }
          ]
        })
      ]
    })
    
    return result.toString()
  }
}
```

使用插件:
```typescript
// picto.config.ts
import { CompressPlugin } from './my-compress-plugin'

export default {
  sources: [...],
  outputs: [...],
  plugins: [
    new CompressPlugin()
  ]
}
```

# 第4节: 发布npm插件包

```json
// package.json
{
  "name": "@myorg/picto-plugin-compress",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "@picto/core": "^1.0.0"
  }
}
```

# 课后练习
1. 开发一个Sketch集成插件
2. 开发一个图标字体生成插件
3. 开发一个设计Token同步插件
```

---

## 教学交付清单

### 每个阶段的交付物

| 阶段 | 文档数量 | 代码示例 | 视频时长 | 练习题 |
|-----|---------|---------|---------|--------|
| Phase 0 | 5篇 | 5个仓库分支 | 3小时 | 15题 |
| Phase 1 Sprint 1-2 | 2篇 | 完整示例 | 2小时 | 10题 |
| Phase 1 Sprint 3-4 | 1篇 | Figma集成 | 1.5小时 | 5题 |
| Phase 1 Sprint 5-6 | 1篇 | 代码生成器 | 1.5小时 | 5题 |
| Phase 1 Sprint 7-8 | 1篇 | 测试完整案例 | 2小时 | 8题 |
| Phase 2 | 2篇 | 缓存&Watch | 2小时 | 8题 |
| Phase 3 | 1篇 | 插件系统 | 2小时 | 5题 |

### 教学资源库结构

```
picto-tutorials/
├── phase-0-setup/
│   ├── lesson-1-monorepo/
│   │   ├── README.md           # 文章
│   │   ├── code/               # 代码示例
│   │   └── exercises/          # 练习题
│   ├── lesson-2-typescript/
│   ├── lesson-3-tsup/
│   ├── lesson-4-quality-tools/
│   └── lesson-5-cicd/
├── phase-1-mvp/
│   ├── sprint-1-2-cli-config/
│   ├── sprint-3-4-figma/
│   ├── sprint-5-6-generators/
│   └── sprint-7-8-testing/
├── phase-2-advanced/
│   ├── cache-system/
│   └── watch-mode/
└── phase-3-ecosystem/
    └── plugin-system/
```

### 视频教程脚本

每个教学文档都配套视频教程,视频结构:

1. **开场 (2分钟)**
   - 本节目标
   - 前置知识
   - 学习路径

2. **理论讲解 (30%时长)**
   - 概念介绍
   - 设计原理
   - 最佳实践

3. **代码实战 (60%时长)**
   - 逐步编码
   - 常见问题
   - 调试技巧

4. **总结回顾 (10%时长)**
   - 关键要点
   - 课后练习
   - 下节预告

---

## 教学质量保证

### 学习路径验证

每个教学文档发布前需要:
1. ✅ 内部试讲(至少2名开发者)
2. ✅ 代码可复现性测试
3. ✅ 练习题难度评估
4. ✅ 文字和视频一致性检查

### 学员反馈机制

1. **课后调查**
   - 内容清晰度评分
   - 难度适中性评分
   - 实用性评分

2. **答疑渠道**
   - Discord答疑频道
   - GitHub Discussions
   - 定期直播答疑

3. **内容迭代**
   - 根据反馈优化内容
   - 补充常见问题
   - 更新过时信息

---

**文档状态**: ✅ 已完成  
**维护者**: 教学团队  
**最后审核**: 2026-01-20
