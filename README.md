# 🌍 TravelPlan — AI 旅行攻略生成器

> ✨ 暗色主题大屏旅行规划工具。在地图上点击或搜索目的地，AI 自动生成小红书风格的多日旅行攻略，包含时段安排、路线绘制、打卡点推荐与实景图片。

## 🛠 技术栈

| 层级 | 技术 |
|---|---|
| ⚛️ 框架 | React 19 + TypeScript 6 |
| 📦 构建 | Vite 8 |
| 🎨 样式 | Tailwind CSS 4（CSS-based `@theme` 配置） |
| 🗺 地图 | 高德地图 JS API 2.0（`@amap/amap-jsapi-loader`） |
| 🤖 AI | DeepSeek API（OpenAI 兼容格式，JSON 结构化输出） |
| 🔍 搜索/地理编码 | 高德 Web 服务端 REST API |
| 🖼 图片 | Unsplash API + 高德 POI 图片（级联回退） |
| 🔤 字体 | Noto Sans SC / Noto Serif SC / Playfair Display（Google Fonts） |

## 🚀 快速开始

### 1. 📥 克隆并安装

```bash
git clone git@github.com:FLYALLEN-bot/TravelPlan.git
cd TravelPlan
npm install
```

### 2. 🔑 配置 API Key

复制 `.env.example` 为 `.env`，填入以下 Key：

```bash
VITE_DEEPSEEK_API_KEY=sk-your-deepseek-key    # 🤖 DeepSeek AI（必需）
VITE_AMAP_JS_KEY=your-amap-js-key             # 🗺 高德 Web端 JS API — 地图显示（必需）
VITE_AMAP_WS_KEY=your-amap-ws-key             # 🔍 高德 Web服务端 — 搜索/地理编码/POI 图片（必需）
VITE_UNSPLASH_ACCESS_KEY=your-unsplash-key    # 🖼 Unsplash 图片（可选，无 Key 时显示渐变占位）
```

> 💡 **高德 Key 说明**：JS API Key 需在控制台开通「Web端(JS API)」服务；Web 服务端 Key 需开通「Web服务 API」。两者可以相同（同一应用开通两种服务），也可以分开。详见 [高德开放平台](https://lbs.amap.com/)。

### 3. 🏃 启动开发服务器

```bash
npm run dev        # 启动 → http://localhost:5173
```

### 4. 📦 生产构建

```bash
npm run build      # TypeScript 类型检查 + Vite 构建
npm run preview    # 本地预览生产版本
```

## 🎯 使用方式

1. 📍 **选择目的地**：在地图上点击任意位置，或使用左上角搜索框输入地名
2. ✅ **确认并选择天数**：弹窗确认地点名称，选择行程天数（1-7 天）
3. 📋 **查看攻略**：右侧面板展示每天的时段安排、出行贴士、打卡推荐（含实景图片）
4. 🗺 **交互地图**：点击地图上的编号标记查看地点详情；点击时段卡片聚焦对应区域
5. 📌 **活动定位**：每个有坐标的活动旁都有定位图标，点击即可在地图上精确定位并弹出详情
6. 💬 **AI 对话**：底部 QQ 风格聊天面板与 AI 对话，调整行程内容，支持快捷建议

## 📁 项目结构

```
src/
├── api/
│   ├── amap.ts            # 🗺 高德 JS API 加载器
│   ├── amapRest.ts        # 🔍 高德 Web 服务端 REST API（搜索/地理编码/POI 图片）
│   ├── amapGeocoder.ts    # 🧭 地理编码策略编排（POI 搜索 + 地址编码 + 距离验证）
│   ├── anthropic.ts       # 🤖 DeepSeek AI 行程生成（多日 JSON 格式）
│   └── unsplash.ts        # 🖼 打卡点图片（高德 POI → Unsplash 级联回退）
├── components/
│   ├── AMapView.tsx        # 🗺 高德地图容器（暗色主题、SVG 标记、透明 InfoWindow、路线绘制）
│   ├── ItineraryPanel.tsx  # 📋 右侧攻略面板（天切换标签、时段卡片、贴士）
│   ├── TimeSlot.tsx        # ⏰ 时段卡片组件（含活动定位图标交互）
│   ├── PhotoSpotBadge.tsx  # 📸 打卡点卡片（实景图片 / 渐变占位）
│   ├── SearchBar.tsx       # 🔎 浮动搜索栏（REST API 自动补全）
│   ├── PlaceConfirmDialog.tsx  # ✅ 地点确认 + 天数选择弹窗
│   ├── InlineChatBar.tsx       # 💬 QQ 风格 AI 聊天面板（气泡动画、打字指示器）
│   ├── ApiKeyModal.tsx         # 🔑 API Key 设置弹窗
│   ├── ErrorBanner.tsx         # ⚠️ 错误提示横幅
│   └── ItinerarySkeleton.tsx   # 💀 加载骨架屏
├── types/
│   ├── itinerary.ts       # 📝 核心类型（MultiDayItinerary, DayPlan, RouteStop 等）
│   └── amap.d.ts          # 📝 高德 JS API 2.0 类型声明
├── utils/
│   └── formatItinerary.ts  # 🔄 AI 响应解析、地理编码充实、回退行程生成
├── App.tsx                 # 🏠 根组件（useReducer 全局状态管理）
├── index.css               # 🎨 Tailwind @theme 设计系统 + 全局样式
└── main.tsx                # 🚪 入口
```

## 🔄 数据流

```
📍 地图点击 / 🔎 搜索选择
  → 🧭 高德 REST 逆地理编码（regeo）获取地名
  → ✅ PlaceConfirmDialog 确认 + 选择天数
  → 🤖 DeepSeek API（JSON mode，生成 N 天行程）
  → 📋 parseItineraryResponse → dispatch SET_ITINERARY（面板立刻显示）
  → ⚡ 后台并行：
     a. 🧭 enrichItineraryWithCoordinates（高德 POI 搜索 + 地址编码 + 距离验证）
     b. 🖼 fetchAllPhotoImages（高德 POI → Unsplash 获取打卡图片）
  → 🗺 每次 enrich 完成 dispatch SET_ITINERARY（地图路线更新）
  → 📌 侧栏活动图标点击 → 地图 panTo 居中 + InfoWindow 弹出
```

## 🧭 地理编码管线

AI 不产出坐标（LLM 会幻觉 lat/lon）。AI 输出 `name` + `city` + `address` + `status`，地理编码由 `enrichItineraryWithCoordinates` 完成：

1. 🏙 从 `locationName` 提取纯城市名（如"重庆市渝中区" → "重庆市"）作为全局城市上下文
2. 🔁 遍历每天的每个时段活动，调用 `geocodePlace`
3. 🎯 `geocodePlace` 采用 3 层级联策略：
   - **策略 1**：AI 提供的结构化地址 → `/geocode/geo`（地址编码）
   - **策略 2**：POI 名称 + 城市约束 → `/place/text`（`citylimit=true`）
   - **策略 3**：POI 名称无城市约束 → `/place/text`（宽泛搜索）
4. 📏 所有结果经过 **Haversine 距离验证**（50km 阈值），拒绝远离目标城市的同名 POI
5. 🏆 多候选结果按「城市匹配 > 范围内 > 距离最近」优先级排序
6. ✅ 能解析的活动获得真实 `lat`/`lon`；不能的标记 `notFound: true`（UI 显示"未匹配"）
7. 🛤 `routeStops` 从有坐标的活动重建
8. 🛡 全链路 `isFinite()` 守卫，NaN 坐标绝不进入地图

## 🤖 AI 提示词工程

系统提示词对 AI 输出质量有严格约束：

- 📍 **地点精确性**：`name` 必须是高德地图可搜索的官方全称（含分店/入口），`address` 必须是"区+街道+门牌号"格式
- 🏙 **城市一致性**：所有活动的 `city` 字段必须与目的地城市一致，禁止跨城市推荐
- 🔤 **图片关键词**：`photoSpots` 的 `searchKeyword` 为标准英文名称，用于 Unsplash 精确搜索
- 🏷 **状态标记**：`verified` / `unverified` 标记 AI 对地址的确定程度

## ✨ 设计特点

- 🌑 **暗色 Luxe Noir 主题**：全局暗色配色，地图暗色风格，微妙的边框光效
- 🀄 **中文排版友好**：Noto Sans SC + Noto Serif SC 字体组合，适合中文阅读
- 🟠 **透明橙色 InfoWindow**：`rgba(255,106,0,0.45)` 半透明背景 + `backdrop-filter: blur(16px)` 毛玻璃效果，任何底图清晰可见且不遮挡地图；右上角 × 关闭按钮；三角箭头、白色文字 + 投影
- 🔢 **SVG 描边标记**：地图标记使用 `paint-order: stroke fill` 保证文字在任何底图上清晰可读
- 📌 **活动独立定位**：每个有坐标的活动旁显示定位图标，点击后地图 `panTo` 平滑居中并弹出详情窗
- 💬 **QQ 风格 AI 聊天**：气泡动画（弹性缩放入场）、打字指示器（三点弹跳）、渐变发送按钮、快捷建议标签
- 🖼 **多源图片回退**：打卡点图片高德 POI → Unsplash → 渐变占位，城市名精确提取避免搜到不相关图片
- 🛡 **NaN 全链路防御**：所有地图坐标操作前 `isFinite()` 校验，防止黑屏崩溃
- 🧭 **智能地理编码**：AI 输出 city + address 字段，POI 搜索 + 地址编码 + 距离验证多策略级联
- 📅 **多日行程**：1-7 天自由选择，天切换标签实时更换地图路线
- 🧱 **层叠上下文隔离**：地图容器与侧栏使用 `isolation: isolate`，InfoWindow 高 z-index 严格限定在地图内部

## 📄 License

MIT
