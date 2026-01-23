# Picto Category 提取优化

## 🎯 问题

之前的实现使用了复杂的优先级算法（50+ 行代码），实际上不需要。

## ✅ 简化方案

### 核心逻辑

Figma 文件结构是清晰的层级：

```
DOCUMENT
└── CANVAS (Icons)
    ├── FRAME (通用图标)     ← 这就是 category！
    ├── FRAME (编辑器)       ← 这就是 category！
    ├── FRAME (花瓣)         ← 这就是 category！
    └── ...
```

**Category = 直接在 CANVAS 下的 FRAME 节点名称**

### 简化后的代码

```typescript
// 之前：50+ 行，优先级算法，中文检测，复杂排序
// 现在：15 行，直接查找

private parseName(name: string, parents: FigmaNode[]): { displayName: string; category?: string } {
  // 从父节点链中找到 CANVAS 下的直接子节点
  for (let i = parents.length - 1; i >= 0; i--) {
    const parent = parents[i]
    const grandparent = parents[i + 1]
    
    // 检查是否是 CANVAS 的直接子节点
    if (
      (parent?.type === 'FRAME' || parent?.type === 'GROUP') &&
      grandparent?.type === 'CANVAS'
    ) {
      const categoryName = parent.name?.trim()
      
      if (categoryName && !categoryName.startsWith('.') && !categoryName.startsWith('_')) {
        return { displayName: name.trim(), category: categoryName }
      }
    }
  }
  
  return { displayName: name.trim() }
}
```

## 📊 对比

| 指标 | 之前 | 现在 | 改进 |
|------|------|------|------|
| 代码行数 | ~50 行 | ~15 行 | **70% 减少** |
| 逻辑复杂度 | 优先级、排序、中文检测 | 直接查找 | **简单清晰** |
| 性能 | O(n) 遍历 + 排序 | O(n) 遍历 | **更快** |
| 可维护性 | 复杂 | 简单 | **易维护** |

## 🎯 支持的所有模块

根据 Figma 文件，自动识别以下顶层模块：

- 通用图标
- 编辑器
- 花瓣
- 套版
- 创作
- 稿定AI
- 电商
- KA
- insMind
- APP
- 智能设计
- 创意画布
- SKA
- cutout

## ✅ 测试结果

```bash
# 拉取 "通用图标" 模块
filters: { categories: ['通用图标'] }
✅ Found 480 icon(s)

# 拉取所有模块
# 不设置 filters
✅ Found 1186 icon(s)

# 拉取多个模块
filters: { categories: ['通用图标', '编辑器'] }
✅ Found 480 + 128 = 608 icon(s)
```

## 🚀 使用方式

```typescript
// picto.config.ts
export default defineConfig({
  sources: [{
    type: 'figma',
    url: 'https://www.figma.com/file/...',
    token: 'YOUR_TOKEN',
    filters: {
      // 拉取单个模块
      categories: ['通用图标'],
      
      // 或拉取多个模块
      // categories: ['通用图标', '编辑器', '花瓣'],
      
      // 或不设置，拉取全部
    },
  }],
})
```

## 📝 总结

- ✅ 删除了不必要的优先级算法
- ✅ 删除了中文检测逻辑
- ✅ 删除了复杂的排序
- ✅ 代码从 50+ 行减少到 15 行
- ✅ 逻辑更清晰，更易维护
- ✅ 性能更好
- ✅ 功能完全正常

**核心原则：简单就是美。**
