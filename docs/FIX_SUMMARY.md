# Picto 修复总结报告

生成时间：2026-01-23

## ✅ 修复完成

所有关键问题已修复并测试通过。

---

## 🎯 修复的问题

### 1. ✅ Category 过滤失效（主要问题）

**问题**：`filters.categories: ['通用图标']` 配置不生效，总是拉取全部图标或 0 个图标。

**根本原因**：
- Parser 没有跟踪父节点信息
- 只从最近的父节点提取 category（如 "Frame 6"）
- 没有找到更深层的有意义的父节点（如 "通用图标"）

**修复方案**：
```typescript
// packages/core/src/sources/figma/parser.ts

// ✅ 修改 1: 添加父节点跟踪
private traverseNode(
  node: FigmaNode,
  parents: FigmaNode[],  // ← 新增参数
  callback: (node: FigmaNode, parents: FigmaNode[]) => void
): void {
  if (node.name?.startsWith('.')) return
  callback(node, parents)
  
  if (node.children) {
    for (const child of node.children) {
      this.traverseNode(child, [node, ...parents], callback)  // ← 累积父节点
    }
  }
}

// ✅ 修改 2: 智能 category 提取（优先选择有意义的名称）
private parseName(name: string, parents: FigmaNode[]): { ... } {
  const candidates: Array<{ name: string; priority: number }> = []
  
  for (const parent of parents) {
    if (parent.type === 'FRAME' || parent.type === 'GROUP') {
      // 跳过自动生成的 Frame 名称
      if (/^Frame \d{10,}$/.test(parentName)) continue
      
      // 计算优先级
      let priority = /^Frame( \d{1,3})?$/.test(parentName) ? 1 : 10
      
      // 中文名称加分
      if (/[\u4e00-\u9fa5]/.test(parentName)) {
        priority += 5
      }
      
      candidates.push({ name: parentName, priority })
    }
  }
  
  // 返回优先级最高的
  candidates.sort((a, b) => b.priority - a.priority)
  return { displayName: name.trim(), category: candidates[0]!.name }
}
```

**效果**：
- ✅ 成功识别 "通用图标" category（414 个图标）
- ✅ `filters.categories` 配置正常工作
- ✅ 支持多层级父节点，自动选择最有意义的名称

---

### 2. ✅ 缓存机制完全失效（严重问题）

**问题**：即使有缓存，每次 pull 都重新拉取，耗时 4.5 分钟。

**根本原因**：
```typescript
// 之前的错误实现
const cached = await this.cacheManager.getCachedIcons(cacheKey)
if (cached) {
  const fresh = await plugin.fetch({})  // ❌ 总是重新拉取
  return fresh  // ❌ 总是返回最新数据，缓存形同虚设
}
```

**修复方案**：
```typescript
// packages/core/src/engine/index.ts

private async fetchFromSource(sourceConfig: Config['sources'][0]): Promise<IconMetadata[]> {
  const cacheKey = this.generateCacheKey(sourceConfig)
  const cached = await this.cacheManager.getCachedIcons(cacheKey)
  
  if (cached) {
    // ✅ 检查缓存年龄
    const cacheAge = await this.getCacheAge(cacheKey)
    const ttl = this.config.cache?.ttl || 3600
    
    if (cacheAge !== null && cacheAge < ttl) {
      this.logger.info(`Using cached icons (${cached.length} icons, age: ${Math.round(cacheAge)}s)`)
      return cached  // ✅ 直接返回缓存
    }
    
    this.logger.info(`Cache expired (age: ${cacheAge}s, ttl: ${ttl}s), refreshing...`)
  }
  
  // 缓存过期或不存在，重新拉取
  const icons = await plugin.fetch({})
  await this.cacheManager.cacheIcons(cacheKey, icons)
  return icons
}
```

**效果**：
- ✅ 首次 pull：~20 秒（正常拉取 + 生成）
- ✅ 第二次 pull：~3 秒（使用缓存，只重新生成文件）
- ✅ 缓存过期后：自动刷新
- ✅ **性能提升：从 270 秒 → 3 秒（90x 加速）**

---

### 3. ✅ 缓存键过长（潜在问题）

**问题**：缓存键包含完整的 URL 和 token，长度 200+ 字符。

**风险**：
- 文件名过长可能超过系统限制
- 包含敏感 token 信息
- 配置稍变就失效

**修复方案**：
```typescript
// packages/core/src/engine/index.ts

private generateCacheKey(sourceConfig: Config['sources'][0]): string {
  const { type } = sourceConfig
  
  let keyData: Record<string, unknown> = { type }
  
  if (type === 'figma') {
    const fileKey = this.extractFileKey(figmaConfig.url)  // 只提取 fileKey
    keyData = {
      type,
      fileKey,  // ← 短字符串
      nodeIds: figmaConfig.nodeIds,
      filters: figmaConfig.filters,
    }
  }
  
  // 生成短哈希
  const hash = this.hashObject(keyData)  // 12 字符
  return `${type}:${hash}`  // 结果: "figma:7a8b9c0d1e2f"
}
```

**效果**：
- ✅ 缓存键从 200+ 字符缩短到 ~18 字符
- ✅ 不包含敏感 token 信息
- ✅ 更稳定的缓存匹配

---

### 4. ✅ ComponentMap 查找低效

**问题**：使用 `Array.from().find()` 遍历查找。

**修复方案**：
```typescript
// 正确的映射关系
Object.entries(file.components || {}).forEach(([nodeId, component]) => {
  componentMap.set(nodeId, component)  // ← nodeId 作为 key
})

// O(1) 查找
const component = componentMap.get(node.id)  // ← 直接查找
```

**效果**：
- ✅ 从 O(n) 优化到 O(1)
- ✅ 1186 个图标的查找性能显著提升

---

## 📊 性能对比

| 场景 | 修复前 | 修复后 | 加速比 |
|------|--------|--------|--------|
| **首次 pull（414 图标）** | 4.5 分钟 | **20 秒** | **13.5x** |
| **重复 pull（缓存命中）** | 4.5 分钟 | **3 秒** | **90x** ✨ |
| **Category 过滤** | ❌ 不生效 | ✅ 正常 | - |

---

## 🎯 测试结果

### 测试 1：Category 过滤

```bash
$ pnpm picto pull

# 结果
✅ Found 1186 total icons
✅ "通用图标": 414 icon(s)
✅ Found 414 icon(s) after filtering
✅ Generated 416 file(s)
```

### 测试 2：缓存功能

```bash
# 第一次（无缓存）
$ pnpm picto pull
✅ Fetched 414 icon(s)
⏱️  耗时: ~20 秒

# 第二次（有缓存，TTL 内）
$ pnpm picto pull
✅ Using cached icons for figma (414 icons, age: 19s)
⏱️  耗时: ~3 秒
```

### 测试 3：自动分批处理

```bash
✅ Splitting 414 icons into batches of 100...
✅ Processing batch 1/5 (100 icons)...
✅ Processing batch 2/5 (100 icons)...
✅ Processing batch 3/5 (100 icons)...
✅ Processing batch 4/5 (100 icons)...
✅ Processing batch 5/5 (14 icons)...
✅ Total: exported 414 image(s)
```

---

## 📝 修改的文件

### 核心修复

1. **`packages/core/src/sources/figma/parser.ts`**
   - 添加父节点跟踪
   - 实现智能 category 提取（优先级策略）
   - 修复 componentMap 查找
   - 添加详细日志

2. **`packages/core/src/engine/index.ts`**
   - 修复缓存逻辑（真正使用缓存）
   - 优化缓存键生成（短哈希）
   - 添加缓存年龄检查

3. **`packages/core/src/cache/manager.ts`**
   - 添加 `getCacheAge()` 方法

---

## 🚀 使用指南

### 推荐配置

```typescript
// picto.config.ts
export default defineConfig({
  sources: [{
    type: 'figma',
    url: 'https://www.figma.com/file/...',
    token: 'YOUR_TOKEN',
    filters: {
      categories: ['通用图标'],  // ✅ 现在正常工作
    },
  }],
  cache: {
    enabled: true,
    ttl: 3600,  // 1 小时
  },
})
```

### 常见场景

#### 场景 1：拉取特定 category 的图标

```bash
# 配置 filters.categories
filters: {
  categories: ['通用图标', '编辑器']
}

# 拉取
$ pnpm picto pull
✅ 只拉取匹配的图标
```

#### 场景 2：强制刷新（忽略缓存）

```bash
# 方法 1: 清除缓存
$ rm -rf .picto/cache
$ pnpm picto pull

# 方法 2: 等待 TTL 过期（1 小时后自动刷新）
```

#### 场景 3：查看所有 category

```bash
# 修改配置，不设置 filters
$ pnpm picto pull 2>&1 | grep "Categories found:" -A 50
```

---

## 🎓 技术要点

### 1. Figma 文件结构

```
DOCUMENT
└── CANVAS
    └── FRAME (通用图标)          ← Category 在这里！
        └── FRAME (Navigation Line 1)
            └── COMPONENT (users)  ← 图标节点
```

### 2. Category 提取策略

| 父节点名称 | 优先级 | 是否使用 |
|-----------|--------|---------|
| `通用图标` (中文) | 15 | ✅ 最优先 |
| `Navigation Line 1` | 10 | ✅ 次选 |
| `Frame 6` | 1 | ✅ 保底 |
| `Frame 1321316838` | - | ❌ 跳过（自动生成） |

### 3. 缓存机制

```
首次 pull → 拉取 + 生成 → 存储缓存 (TTL: 1h)
           ↓
第二次 pull → 检查缓存年龄 → 未过期 → 直接返回 (3s)
                          ↓
                       已过期 → 重新拉取 (20s)
```

---

## 🔮 未来优化

### 已完成 ✅

- [x] 修复 category 过滤
- [x] 修复缓存机制
- [x] 优化缓存键生成
- [x] 添加调试日志

### 待优化 🚧

- [ ] 增量生成组件（只生成变化的图标）
- [ ] Figma 版本号检查（快速判断是否变化）
- [ ] 并行生成组件（提升生成速度）
- [ ] 更智能的缓存失效策略

---

## 📚 相关文档

- **FLOW_AUDIT_REPORT.md**：完整的流程审查报告
- **guide.md**：技术指南和工作原理

---

## 🎉 总结

所有关键问题已修复并测试通过：

1. ✅ **Category 过滤正常工作**（从 0 个 → 414 个）
2. ✅ **缓存机制正常工作**（从 4.5 分钟 → 3 秒）
3. ✅ **性能大幅提升**（90x 加速）
4. ✅ **自动分批处理**（避免 413 错误）

**Picto 现在可以高效稳定地使用了！** 🚀
