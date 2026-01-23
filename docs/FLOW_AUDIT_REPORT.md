# Picto 流程审查报告

生成时间：2026-01-23

## 🎯 审查目标

1. 定位 `filters.categories` 不生效的根本原因
2. 识别所有冗余操作和配置
3. 优化数据处理流程

---

## 🔴 严重问题（Critical Issues）

### 1. ❌ 缓存机制形同虚设

**位置**：`packages/core/src/engine/index.ts:217-243`

**问题描述**：
```typescript
const cached = await this.cacheManager.getCachedIcons(cacheKey)
if (cached) {
  this.logger.info(`Using cached icons for ${sourceConfig.type}`)
  
  // ❌ 即使有缓存，仍然调用完整的 API 流程
  const fresh = await plugin.fetch({})  // 耗时 4.5 分钟！
  
  const changes = this.changeDetector.detectChanges(cached, fresh)
  
  // ❌ 总是返回 fresh，缓存形同虚设
  await this.cacheManager.cacheIcons(cacheKey, fresh)
  return fresh
}
```

**影响**：
- 每次 pull 都要等待 4.5 分钟
- TTL 配置（3600秒）完全无效
- 网络和 CPU 资源浪费

**修复方案**：
```typescript
const cached = await this.cacheManager.getCachedIcons(cacheKey)
if (cached) {
  // ✅ 检查缓存是否过期
  const cacheAge = this.getCacheAge(cacheKey)
  
  if (cacheAge < this.config.cache.ttl) {
    this.logger.info(`Using cached icons (age: ${cacheAge}s)`)
    return cached  // 直接返回，0.5秒内完成
  }
  
  this.logger.info('Cache expired, refreshing...')
}

// 缓存过期或不存在，重新拉取
const fresh = await plugin.fetch({})
await this.cacheManager.cacheIcons(cacheKey, fresh)
return fresh
```

---

### 2. ❌ Category 过滤逻辑失效

**位置**：`packages/core/src/sources/figma/parser.ts:148-158`

**问题描述**：
```typescript
// 当前实现只支持从节点名称中提取 category
private parseName(name: string): { displayName: string; category?: string } {
  // 只检查 "Category/IconName" 格式
  if (name.includes('/')) {
    const parts = name.split('/')
    return { displayName: parts[1], category: parts[0] }
  }
  
  // ❌ 没有从父节点提取 category
  return { displayName: name.trim() }
}
```

**实际 Figma 文件结构**：
```
DOCUMENT
└── CANVAS (Page 1)
    └── FRAME (通用图标)  ← category 在这里
        ├── COMPONENT (logout)  ← 节点名称只有 "logout"
        ├── COMPONENT (home)
        └── COMPONENT (user)
```

**结果**：
- 所有图标的 `category` 都是 `undefined`
- `filters.categories: ['通用图标']` 配置无法生效
- 每次都拉取全部 130+ 个图标

**修复方案**：
```typescript
// 修改 traverseNode 方法，跟踪父节点
private traverseNode(
  node: FigmaNode,
  parents: FigmaNode[],  // 添加父节点参数
  callback: (node: FigmaNode, parents: FigmaNode[]) => void
): void {
  if (node.name?.startsWith('.')) return  // 跳过隐藏节点
  
  callback(node, parents)
  
  if (node.children) {
    for (const child of node.children) {
      this.traverseNode(child, [node, ...parents], callback)  // 累积父节点
    }
  }
}

// 修改 parseName 方法，从父节点提取 category
private parseName(
  name: string,
  parents: FigmaNode[]  // 接收父节点参数
): { displayName: string; category?: string } {
  // 用户明确说不存在 "Category/IconName" 格式，删除这部分逻辑
  
  // ✅ 从父节点中查找 category（FRAME 或 GROUP）
  for (const parent of parents) {
    if (parent.type === 'FRAME' || parent.type === 'GROUP') {
      if (
        parent.name &&
        !parent.name.startsWith('.') &&
        !parent.name.startsWith('_')
      ) {
        return {
          displayName: name.trim(),
          category: parent.name.trim()  // "通用图标"
        }
      }
    }
  }
  
  return { displayName: name.trim() }
}
```

---

### 3. ❌ 缓存键生成问题

**位置**：`packages/core/src/engine/index.ts:214`

**问题描述**：
```typescript
const cacheKey = `${sourceConfig.type}:${JSON.stringify(sourceConfig)}`
// 结果：figma:{"type":"figma","url":"https://www.figma.com/file/lNtZjYrzLjkZohZLP0OVnz/Gaoding-图标库...","token":"291200-0792e958...","filters":{...}}
// 长度：200+ 字符
```

**问题**：
- 文件名过长（可能超过系统限制）
- 包含敏感的 token 信息
- 配置稍有变化就失效（如调整 filters）

**修复方案**：
```typescript
import { createHash } from 'crypto'

function generateCacheKey(sourceConfig: SourceConfig): string {
  const { type, url, nodeIds, filters } = sourceConfig
  
  // 提取 fileKey
  const fileKey = extractFileKey(url)
  
  // 生成配置哈希
  const configHash = createHash('md5')
    .update(JSON.stringify({ type, fileKey, nodeIds, filters }))
    .digest('hex')
    .slice(0, 12)
  
  return `${type}:${configHash}`
  // 结果：figma:7a8b9c0d1e2f（长度：18 字符）
}
```

---

## 🟡 配置冗余（Configuration Redundancy）

### 4. ⚠️ nodeIds 和 filters.categories 重复

**位置**：`apps/demo-figma-react/picto.config.ts`

**问题描述**：
```typescript
{
  nodeIds: ['615:324'],  // ⚠️ 限制拉取范围
  filters: {
    categories: ['通用图标'],  // ⚠️ 也是限制范围
  },
}
```

**分析**：
- `nodeIds: ['615:324']` 告诉 Figma API "只拉取这个节点下的内容"
- `filters.categories` 告诉 Parser "只保留这些分类的图标"
- 如果 `615:324` 节点就是 "通用图标" Frame，两者等效

**建议**：
```typescript
// 方案 A：只用 nodeIds（推荐，减少 API 请求）
{
  nodeIds: ['615:324'],  // 615:324 就是 "通用图标" Frame
  // 不需要 filters
}

// 方案 B：只用 filters（灵活性更高）
{
  // 不设置 nodeIds，拉取整个文件
  filters: {
    categories: ['通用图标', '其他分类'],  // 可以多选
  },
}
```

**trade-off**：
- **方案 A**：API 请求更快（只请求指定节点），但不灵活
- **方案 B**：需要请求完整文件（稍慢），但可以灵活过滤多个分类

---

### 5. ⚠️ includeComponents/includeInstances 冗余

**位置**：`picto.config.ts` + `parser.ts`

**问题描述**：
```typescript
// Config
{
  includeComponents: true,   // ⚠️ 默认就是 true
  includeInstances: false,   // ⚠️ 默认就是 false
}

// Parser
if (node.type === 'COMPONENT' && !includeComponents) return null
if (node.type === 'INSTANCE' && !includeInstances) return null
```

**分析**：
- 99% 的场景只需要 `COMPONENT` 类型
- `INSTANCE` 是组件实例，通常不需要作为图标
- `COMPONENT_SET` 是变体集合，也很少用到

**建议**：
```typescript
// 删除这些配置，直接硬编码
// 在 parser.ts 中：
if (!['COMPONENT'].includes(node.type)) {
  return null
}
```

---

## 🟢 代码冗余（Code Redundancy）

### 6. ⚠️ componentMap 查找逻辑错误

**位置**：`packages/core/src/sources/figma/parser.ts:55-57,129`

**问题描述**：
```typescript
// 第 55-57 行：构建 componentMap
Object.entries(file.components || {}).forEach(([key, component]) => {
  componentMap.set(key, component)
  // key 是什么？是 component.id 吗？
})

// 第 129 行：查找 component
const component = Array.from(componentMap.values()).find(c => c.key === node.id)
// ❌ 遍历所有值查找，效率低下
// ❌ component.key 和 node.id 是否匹配？
```

**分析**：
```typescript
// Figma API 返回的 components 结构
{
  "components": {
    "615:325": {  // ← 这个 key 是 node.id
      "key": "abc123def456",  // ← 这是 component.key（不同的值）
      "name": "logout",
      "description": "..."
    }
  }
}
```

**修复方案**：
```typescript
// 正确的构建方式：node.id → component
const componentMap = new Map<string, FigmaComponent>()
Object.entries(file.components || {}).forEach(([nodeId, component]) => {
  componentMap.set(nodeId, component)  // 用 nodeId 作为 key
})

// 正确的查找方式
const component = componentMap.get(node.id)  // O(1) 查找
```

---

### 7. ⚠️ Category/IconName 格式支持（已确认不存在）

**位置**：`packages/core/src/sources/figma/parser.ts:148-156`

**问题描述**：
```typescript
private parseName(name: string): { displayName: string; category?: string } {
  // ❌ 用户明确说不存在这种格式
  if (name.includes('/')) {
    const parts = name.split('/')
    const category = parts.slice(0, -1).join('/')
    const displayName = parts[parts.length - 1] || name
    return { displayName: displayName.trim(), category: category.trim() }
  }
  
  return { displayName: name.trim() }
}
```

**建议**：
```typescript
// 删除 "/" 分隔符的逻辑，简化为：
private parseName(name: string, parents: FigmaNode[]): { displayName: string; category?: string } {
  // 只从父节点提取 category
  for (const parent of parents) {
    if (parent.type === 'FRAME' || parent.type === 'GROUP') {
      if (parent.name && !parent.name.startsWith('.') && !parent.name.startsWith('_')) {
        return { displayName: name.trim(), category: parent.name.trim() }
      }
    }
  }
  
  return { displayName: name.trim() }
}
```

---

### 8. ⚠️ 变体（Variants）解析可能不需要

**位置**：`packages/core/src/sources/figma/parser.ts:177-194`

**问题描述**：
```typescript
private parseVariants(node: FigmaNode): Array<{ name: string; value: string }> | undefined {
  if (!node.componentPropertyDefinitions) return undefined
  
  const variants: Array<{ name: string; value: string }> = []
  
  Object.entries(node.componentPropertyDefinitions).forEach(([key, value]) => {
    if (value && typeof value === 'object' && 'defaultValue' in value) {
      variants.push({
        name: key,
        value: String(value.defaultValue),
      })
    }
  })
  
  return variants.length > 0 ? variants : undefined
}
```

**分析**：
- Figma 的 Variants 用于组件变体（如 Button/Primary, Button/Secondary）
- 图标通常不使用变体功能
- 如果不需要，可以删除这部分逻辑

**建议**：
- 如果项目中不用变体，删除这个方法
- 如果未来可能用到，保留但添加注释

---

### 9. ⚠️ 颜色提取过滤黑色可能不合理

**位置**：`packages/core/src/sources/figma/transformer.ts:122`

**问题描述**：
```typescript
if (normalized && normalized !== '#000000' && normalized !== '#000') {
  colors.add(normalized)
}
```

**分析**：
- 很多图标本身就是纯黑色（单色图标）
- 过滤掉黑色会导致这些图标的 colors 数组为空
- 可能影响后续的颜色分析或主题功能

**建议**：
```typescript
// 移除黑色过滤，保留所有颜色
if (normalized) {
  colors.add(normalized)
}
```

---

## 📊 性能优化建议

### 10. ✅ 添加 Figma 版本号检查

**位置**：新增功能

**方案**：
```typescript
// 在 engine/index.ts 中
private async fetchFromSource(sourceConfig: Config['sources'][0]): Promise<IconMetadata[]> {
  const cacheKey = this.generateCacheKey(sourceConfig)
  const cached = await this.cacheManager.getCachedIcons(cacheKey)
  
  if (cached) {
    const cacheAge = this.getCacheAge(cacheKey)
    
    // TTL 未过期，直接返回
    if (cacheAge < this.config.cache.ttl) {
      return cached
    }
    
    // TTL 过期，但可以检查版本号
    if (sourceConfig.type === 'figma') {
      const fileKey = this.extractFileKey(sourceConfig.url)
      const file = await this.client.getFile(fileKey)  // 只拉取元数据（1秒）
      
      const cachedVersion = await this.cache.get(`figma:${fileKey}:version`)
      
      if (file.version === cachedVersion) {
        this.logger.info('Figma version unchanged, using cache')
        // 更新缓存时间戳，延长 TTL
        await this.cacheManager.cacheIcons(cacheKey, cached)
        return cached
      }
      
      // 记录新版本
      await this.cache.set(`figma:${fileKey}:version`, file.version)
    }
  }
  
  // 真正需要重新拉取
  const fresh = await plugin.fetch({})
  await this.cacheManager.cacheIcons(cacheKey, fresh)
  return fresh
}
```

**效果**：
- 缓存未过期：0.5 秒
- 缓存过期但版本未变：1-2 秒（只请求元数据）
- 版本变化：4.5 分钟（完整拉取）

---

### 11. ✅ 增量生成组件

**位置**：Generator 层

**方案**：
```typescript
// 在 icons/ 目录下生成 .manifest.json
{
  "version": "0.0.1",
  "icons": {
    "615:325": {
      "outputFile": "Iconlogout.tsx",
      "hash": "abc123xyz",
      "generatedAt": "2024-01-22T10:00:00Z"
    }
  }
}

// Generator 中
async generate(icons: IconMetadata[]) {
  const manifest = await this.loadManifest()
  
  // 过滤出需要生成的图标
  const toGenerate = icons.filter(icon => {
    const cached = manifest.icons[icon.id]
    return !cached || cached.hash !== icon.hash
  })
  
  this.logger.info(`${toGenerate.length}/${icons.length} icons need update`)
  
  // 只生成变化的图标
  for (const icon of toGenerate) {
    await this.generateComponent(icon)
    manifest.icons[icon.id] = {
      outputFile: `${this.getComponentName(icon.name)}.tsx`,
      hash: icon.hash,
      generatedAt: new Date().toISOString()
    }
  }
  
  // 清理已删除的图标
  const currentIds = new Set(icons.map(i => i.id))
  for (const id of Object.keys(manifest.icons)) {
    if (!currentIds.has(id)) {
      await this.deleteComponent(manifest.icons[id].outputFile)
      delete manifest.icons[id]
    }
  }
  
  // 总是重新生成 index.ts 和 types.ts
  await this.generateIndex(icons)
  await this.generateTypes(icons)
  await this.saveManifest(manifest)
}
```

---

## 🎯 总结

### 必须修复（高优先级）

1. **修复缓存逻辑**（engine/index.ts）- 立即见效
2. **修复 category 提取**（parser.ts）- 解决主要问题
3. **修复缓存键生成**（engine/index.ts）- 避免潜在问题

### 配置优化（中优先级）

4. **删除 nodeIds 或 filters 之一**（picto.config.ts）- 简化配置
5. **删除 includeComponents/includeInstances**（config + parser）- 减少复杂度

### 代码清理（低优先级）

6. **修复 componentMap 查找**（parser.ts）- 提升性能
7. **删除 Category/IconName 逻辑**（parser.ts）- 简化代码
8. **评估是否需要 variants**（parser.ts）- 减少不必要的解析
9. **移除黑色过滤**（transformer.ts）- 保留完整颜色信息

### 性能优化（可选）

10. **添加版本号检查**（engine/index.ts）- 进一步优化
11. **实现增量生成**（generators）- 大幅提升体验

---

## 📈 预期效果

| 场景 | 当前耗时 | 修复后耗时 | 加速比 |
|------|---------|-----------|--------|
| 无变化重复 pull | 4.5 分钟 | **0.5 秒** | **540x** |
| 版本未变 | 4.5 分钟 | **1-2 秒** | **270x** |
| 5 个图标变化 | 4.5 分钟 | **15-30 秒** | **18x** |
| 首次 pull | 4.5 分钟 | 4.5 分钟 | 1x |
