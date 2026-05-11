# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**重要：所有回复必须使用中文。**

## Commands

```bash
npm run dev       # Vite HMR dev server → localhost:5173
npm run build     # TypeScript check + Vite production build（构建失败不能提交）
npm run preview   # 预览生产构建
```

PowerShell 执行策略限制时用 `cmd /c "npm run dev"`。

## 架构

React 19 + TypeScript + Vite 单页应用，AI 生成小红书风格多日旅行攻略。

**技术栈**：高德地图 JS API 2.0（`@amap/amap-jsapi-loader`）、DeepSeek API（JSON 结构化输出）、高德 Web 服务端 REST API（搜索/地理编码/POI 图片）、Unsplash API（打卡点图片回退）、Tailwind CSS 4（CSS-based `@theme`）。

### 数据流

```
地图点击 / 搜索选择
  → 高德 REST 逆地理编码（regeo）
  → PlaceConfirmDialog 确认地点 + 选择天数（1-7 天）
  → DeepSeek API（JSON mode，系统提示词要求 city/address/status 字段）
  → parseItineraryResponse 校验 → dispatch SET_ITINERARY（面板立刻渲染，无坐标）
  → 后台并行双管线：
     a. enrichItineraryWithCoordinates — 高德地理编码所有活动地点（5 层级联策略）
     b. fetchAllPhotoImages — 高德 POI 图片 → Unsplash 级联回退
  → dispatch SET_ITINERARY（地图路线 + 图片逐步到位）
  → 用户切换 Day Tab → SET_ACTIVE_DAY → 路线按 activeDayIndex 过滤
  → 底部 InlineChatBar AI 对话修改 → re-geocode → 回写
```

全部状态在 `App.tsx` 的 `useReducer` 中管理（`AppState` + `AppAction`）。

### TypeScript 要求

`tsconfig.app.json` 有 `verbatimModuleSyntax: true` — **类型导入必须用 `import type`**，否则构建失败。写 `import type { Foo } from './bar'` 而非 `import { Foo } from './bar'`。

### API 层

- **`src/api/anthropic.ts`** — 调用 DeepSeek API（`api.deepseek.com/chat/completions`），`response_format: { type: "json_object" }`。Key 来自 `VITE_DEEPSEEK_API_KEY` 或 `localStorage('deepseek_api_key')`。认证失败抛 `NO_API_KEY`，其他错误走 `generateFallbackItinerary`。
- **`src/api/amap.ts`** — 高德 JS API 加载器（仅地图显示，不加载插件）。
- **`src/api/amapRest.ts`** — 高德 Web 服务端 REST API 封装：`inputTips`（搜索）、`geocode`/`regeo`（地理编码）、`textSearch`（POI 搜索）、`searchPoiPhoto`（POI 图片）。Key 来自 `VITE_AMAP_WS_KEY`。
- **`src/api/amapGeocoder.ts`** — 地理编码策略编排，5 层级联：city+address → city+name → context+name → name → 返回 null。
- **`src/api/unsplash.ts`** — 打卡点图片：高德 POI 图片 → Unsplash 级联搜索 → 返回 null（UI 显示渐变占位）。Key 来自 `VITE_UNSPLASH_ACCESS_KEY`（可选）。

### 地理编码管线

AI **不**产出坐标（LLM 会幻觉 lat/lon）。AI 输出 `name` + `city` + `address` + `status`，地理编码由 `enrichItineraryWithCoordinates`（`formatItinerary.ts`）完成：
1. 遍历每天的每个时段活动，调用 `geocodePlace`
2. `geocodePlace` 用 5 层策略查高德 REST API
3. 能解析的活动获得真实 `lat`/`lon`；不能的标记 `notFound: true`（UI 显示"未匹配"）
4. `routeStops` 从有坐标的活动重建
5. 全链路 `isFinite()` 守卫，NaN 坐标绝不进入地图

### 地图组件

**`src/components/AMapView.tsx`** — 单文件包含全部地图逻辑：
- 地图初始化（暗色主题 `amap://styles/dark`）
- Pin marker（选中地点图钉）
- Route stops：SVG 编号标记（`paint-order: stroke fill` 描边文字）、zIndex 管理（clicked=999, default=10+i）
- InfoWindow：橙色警示主题（`#FF6A00`、纯黑文字、三角箭头、黑色描边），`isolation: isolate` 层叠隔离
- 路线绘制（glow polyline + dashed line）
- 时段聚焦：`focusedTimeSlot` → `setCenter`（平移不缩放）
- 搜索栏：`src/components/SearchBar.tsx`，用 `amapRest.inputTips` 实现自动补全

### 右侧面板

`ItineraryPanel.tsx` 渲染 `TimeSlot` 卡片（morning/lunch/afternoon/dinner/evening）+ 出行贴士 + 打卡推荐（`PhotoSpotBadge` 含图片/渐变占位）+ 热门笔记。天数 >1 时顶部显示 Day 切换 tab。点击卡片 → `onTimeSlotFocus` 聚焦地图。

### 设计系统

暗色 Luxe Noir 主题，定义在 `src/index.css` 的 `@theme` 中：
- 底色：`#09090b` → `#121217`；强调色：amber `#f59e0b`
- 字体：`font-display`（Playfair Display）、`font-body`（Noto Sans SC）、`font-serif`（Noto Serif SC）
- 玻璃面板：`.glass-card`、`.glass-panel`（`backdrop-filter: blur()`）
- 关键动画：`fadeInUp`、`fadeIn`

### 层叠上下文隔离（重要）

地图容器和右侧栏使用 `isolation: isolate` 形成独立层叠上下文。InfoWindow 的高 z-index 严格限定在地图容器内部，永不泄漏到全局布局。修改 z-index 相关代码时必须注意此约束，否则会导致侧栏模糊或搜索栏消失。

## .env 配置

```bash
VITE_DEEPSEEK_API_KEY=sk-xxx        # 必需
VITE_AMAP_JS_KEY=xxx                # 必需（Web端 JS API）
VITE_AMAP_WS_KEY=xxx                # 必需（Web服务端）
VITE_UNSPLASH_ACCESS_KEY=xxx        # 可选（无则显示渐变占位）
```

高德 JS Key 需开通「Web端(JS API)」，Web 服务端 Key 需开通「Web服务 API」。
