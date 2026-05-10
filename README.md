# TravelPlan — AI 旅行攻略生成器

暗色主题大屏旅行规划工具。在地图上点击或搜索目的地，AI 自动生成小红书风格的多日旅行攻略，包含时段安排、路线绘制、打卡点推荐与实景图片。

## 技术栈

| 层级 | 技术 |
|---|---|
| 框架 | React 19 + TypeScript 6 |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS 4（CSS-based `@theme` 配置） |
| 地图 | 高德地图 JS API 2.0（`@amap/amap-jsapi-loader`） |
| AI | DeepSeek API（OpenAI 兼容格式，JSON 结构化输出） |
| 搜索/地理编码 | 高德 Web 服务端 REST API |
| 图片 | Unsplash API + 高德 POI 图片（级联回退） |
| 字体 | Noto Sans SC / Noto Serif SC / Playfair Display（Google Fonts） |

## 快速开始

### 1. 克隆并安装

```bash
git clone git@github.com:FLYALLEN-bot/TravelPlan.git
cd TravelPlan
npm install
```

### 2. 配置 API Key

复制 `.env.example` 为 `.env`，填入以下 Key：

```bash
VITE_DEEPSEEK_API_KEY=sk-your-deepseek-key    # DeepSeek AI（必需）
VITE_AMAP_JS_KEY=your-amap-js-key             # 高德 Web端 JS API — 地图显示（必需）
VITE_AMAP_WS_KEY=your-amap-ws-key             # 高德 Web服务端 — 搜索/地理编码/POI 图片（必需）
VITE_UNSPLASH_ACCESS_KEY=your-unsplash-key    # Unsplash 图片（可选，无 Key 时显示渐变占位）
```

> **高德 Key 说明**：JS API Key 需在控制台开通「Web端(JS API)」服务；Web 服务端 Key 需开通「Web服务 API」。两者可以相同（同一应用开通两种服务），也可以分开。详见 [高德开放平台](https://lbs.amap.com/)。

### 3. 启动开发服务器

```bash
npm run dev        # 启动 → http://localhost:5173
```

### 4. 生产构建

```bash
npm run build      # TypeScript 类型检查 + Vite 构建
npm run preview    # 本地预览生产版本
```

## 使用方式

1. **选择目的地**：在地图上点击任意位置，或使用左上角搜索框输入地名
2. **确认并选择天数**：弹窗确认地点名称，选择行程天数（1-7 天）
3. **查看攻略**：右侧面板展示每天的时段安排、出行贴士、打卡推荐（含实景图片）
4. **交互地图**：点击地图上的编号标记查看地点详情；点击时段卡片聚焦对应区域
5. **AI 修改**：底部输入框与 AI 对话，调整行程内容

## 项目结构

```
src/
├── api/
│   ├── amap.ts            # 高德 JS API 加载器
│   ├── amapRest.ts        # 高德 Web 服务端 REST API（搜索/地理编码/POI 图片）
│   ├── amapGeocoder.ts    # 地理编码策略编排（city+name → context+name → name）
│   ├── anthropic.ts       # DeepSeek AI 行程生成（多日 JSON 格式）
│   └── unsplash.ts        # 打卡点图片（高德 POI → Unsplash 级联回退）
├── components/
│   ├── AMapView.tsx       # 高德地图容器（暗色主题、SVG 标记、路线绘制）
│   ├── ItineraryPanel.tsx # 右侧攻略面板（天切换标签、时段卡片、贴士）
│   ├── TimeSlot.tsx       # 时段卡片组件
│   ├── PhotoSpotBadge.tsx # 打卡点卡片（实景图片 / 渐变占位）
│   ├── SearchBar.tsx      # 浮动搜索栏（REST API 自动补全）
│   ├── PlaceConfirmDialog.tsx  # 地点确认 + 天数选择弹窗
│   ├── InlineChatBar.tsx       # 底部 AI 对话栏
│   ├── ApiKeyModal.tsx         # API Key 设置弹窗
│   ├── ErrorBanner.tsx         # 错误提示横幅
│   └── ItinerarySkeleton.tsx   # 加载骨架屏
├── types/
│   ├── itinerary.ts       # 核心类型（MultiDayItinerary, DayPlan, RouteStop 等）
│   └── amap.d.ts          # 高德 JS API 2.0 类型声明
├── utils/
│   └── formatItinerary.ts  # AI 响应解析、地理编码充实、回退行程生成
├── App.tsx                 # 根组件（useReducer 全局状态管理）
├── index.css               # Tailwind @theme 设计系统 + 全局样式
└── main.tsx                # 入口
```

## 数据流

```
地图点击 / 搜索选择
  → reverse geocode（高德 REST）获取地名
  → PlaceConfirmDialog 确认 + 选择天数
  → DeepSeek API（JSON mode，生成 N 天行程）
  → parseItineraryResponse → dispatch SET_ITINERARY（面板立刻显示）
  → 后台并行：
     a. enrichItineraryWithCoordinates（高德地理编码所有活动地点）
     b. fetchAllPhotoImages（高德 POI → Unsplash 获取打卡图片）
  → 每次 enrich 完成 dispatch SET_ITINERARY（地图路线更新）
```

## 设计特点

- **暗色 Luxe Noir 主题**：全局暗色配色，地图暗色风格，微妙的边框光效
- **中文排版友好**：Noto Sans SC + Noto Serif SC 字体组合，适合中文阅读
- **SVG 描边标记**：地图标记使用 `paint-order: stroke fill` 保证文字清晰可读
- **多源图片回退**：打卡点图片高德 POI → Unsplash → 渐变占位
- **NaN 全链路防御**：所有地图坐标操作前 `isFinite()` 校验，防止黑屏崩溃
- **智能地理编码**：AI 输出 city + address 字段，多策略级联提升编码精度
- **多日行程**：支持 1-7 天行程生成，天切换标签实时更换地图路线

## License

MIT
