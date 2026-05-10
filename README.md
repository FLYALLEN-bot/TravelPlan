# TravelPlan — AI 旅行攻略生成器

> 在地图上点一下，AI 帮你生成一日旅行攻略。小红书风格，出片打卡 + 美食推荐 + 实用贴士。

**在线体验**：克隆后本地运行，无需 API Key 即可使用（支持浏览器内设置 DeepSeek API Key）。

---

## 功能特点

- **地图选点** — 点击地图任意位置，或搜索中文地名，自动逆地理编码获取地址
- **AI 智能规划** — 调用 DeepSeek 大模型，生成小红书风格的完整一日行程
- **5 个时段安排** — 上午 / 午餐 / 下午 / 晚餐 / 晚间，每个时段 2-3 个地点
- **路线可视化** — 所有地点以编号标记展示在地图上，连线形成完整路线
- **打卡推荐** — AI 推荐最佳拍照点，附带拍摄技巧
- **出行贴士** — 交通建议 + 小红书热门笔记
- **AI 对话修改** — 地图底部内嵌聊天栏，可以直接对话让 AI 调整行程（换餐厅、加景点等）
- **暗色高级 UI** — Luxe Noir 设计风格，大屏桌面端优化，中文排版友好
- **完全免费** — 地图使用 OpenStreetMap（无需 Key），地理编码使用 Nominatim（免费）

---

## 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 样式 | Tailwind CSS 4（CSS-based `@theme`） |
| 地图 | Leaflet + react-leaflet v5（CartoDB 暗色瓦片） |
| AI | DeepSeek API（OpenAI 兼容，JSON mode） |
| 地理编码 | Nominatim（OpenStreetMap 免费 API） |
| 字体 | Noto Sans SC / Noto Serif SC / Playfair Display |

---

## 快速开始

### 1. 克隆项目

```bash
git clone git@github.com:FLYALLEN-bot/TravelPlan.git
cd TravelPlan
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 API Key（二选一）

**方式 A：环境变量（推荐）**

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 DeepSeek API Key：

```
VITE_DEEPSEEK_API_KEY=sk-your-key-here
```

> 前往 [platform.deepseek.com/api_keys](https://platform.deepseek.com/api_keys) 获取 Key。

**方式 B：浏览器内设置**

首次打开应用时，如果未检测到环境变量中的 Key，会自动弹出设置面板。在输入框中粘贴 Key 即可（仅保存在浏览器本地）。

### 4. 启动开发服务器

```bash
npm run dev
```

浏览器访问 `http://localhost:5173`。

### 5. 生产构建

```bash
npm run build
npm run preview
```

---

## 使用指南

### 基本流程

1. **选目的地** — 在地图上点击任意位置，或使用顶部搜索栏输入中文地名（如「杭州西湖」）
2. **确认地点** — 弹出确认框，显示逆地理编码后的地址名称和坐标，点击「生成一日攻略」
3. **查看攻略** — 右侧面板展示完整一日行程，包含 5 个时段、打卡推荐、出行贴士和热门笔记
4. **地图联动** — 将鼠标悬停在侧栏任一时段卡片上，地图上对应地点会放大高亮；点击卡片则地图飞行到该时段区域

### AI 对话修改

攻略生成后，地图下方会出现输入栏，显示「想要什么让AI修改~~~」：

- 点击输入栏展开聊天面板
- 输入修改需求（如「把午餐换成火锅」「下午加一个博物馆」）
- AI 会分析你的需求并返回修改后的行程
- 点击「应用此修改」即可更新右侧面板和地图路线

### 地点匹配说明

AI 生成的地点名称会通过 Nominatim 地理编码服务查询真实坐标（限定在目的地 80km 范围内）。如果某个地点在附近找不到匹配，右侧面板该地点会标注 **（未匹配到该地址）**，且不会在地图上显示标记点。

---

## 项目结构

```
TravelPlan/
├── index.html                          # 入口 HTML（字体 CDN 引入）
├── .env.example                        # 环境变量模板
├── src/
│   ├── main.tsx                        # React 入口
│   ├── App.tsx                         # 核心状态管理 (useReducer)
│   ├── index.css                       # Tailwind @theme 设计系统
│   ├── types/
│   │   └── itinerary.ts               # TypeScript 类型定义
│   ├── api/
│   │   ├── anthropic.ts               # DeepSeek API 封装
│   │   └── nominatim.ts               # 地理编码（5 层回退 + 距离过滤）
│   ├── hooks/
│   │   ├── useItinerary.ts            # AI 生成状态机
│   │   └── useDebounce.ts             # 搜索防抖
│   ├── components/
│   │   ├── MapView.tsx                # Leaflet 地图容器
│   │   ├── SearchBar.tsx              # 地名搜索自动补全
│   │   ├── RouteOverlay.tsx           # 路线折线 + 编号标记
│   │   ├── ItineraryPanel.tsx         # 右侧攻略面板
│   │   ├── TimeSlot.tsx               # 单个时段卡片
│   │   ├── PhotoSpotBadge.tsx         # 打卡点徽章
│   │   ├── InlineChatBar.tsx          # 地图底部 AI 对话栏
│   │   ├── PlaceConfirmDialog.tsx     # 确认目的地弹窗
│   │   ├── ApiKeyModal.tsx            # API Key 设置弹窗
│   │   ├── ErrorBanner.tsx            # 错误提示组件
│   │   └── ItinerarySkeleton.tsx      # 加载骨架屏
│   └── utils/
│       ├── iconFactory.ts             # Leaflet 自定义图钉
│       └── formatItinerary.ts         # AI 响应解析 + 坐标丰富
```

---

## 设计系统

采用 **Luxe Noir** 暗色主题：

- **底色**：`#09090b` → `#121217` → `#1a1a24` 三层递进
- **强调色**：Amber `#f59e0b`（按钮、高亮、路线、图钉）
- **辅助色**：Rose `#fb7185`、Teal `#2dd4bf`、Indigo `#818cf8`
- **排版**：Noto Sans SC（正文）+ Playfair Display / Noto Serif SC（标题）
- **效果**：毛玻璃面板（`backdrop-filter: blur(24px)`）、琥珀色辉光动画、微妙的白色半透明边框

---

## License

MIT
