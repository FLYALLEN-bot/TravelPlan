import type { MultiDayItinerary } from '../types/itinerary';
import { parseItineraryResponse, generateFallbackItinerary } from '../utils/formatItinerary';

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

function getApiKey(): string | null {
  const envKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (envKey) return envKey;
  const storedKey = localStorage.getItem('deepseek_api_key');
  if (storedKey) return storedKey;
  return null;
}

function buildSystemPrompt(dayCount: number): string {
  return `你是一个小红书（RED）旅行内容专家，擅长创作精美、实用的旅行攻略。你的攻略风格深受小红书用户喜爱，强调：

1. 出片率高的打卡点（拍照好看的地方）
2. 隐藏的小众店铺和本地人才知道的美食
3. 实用的交通和游玩 tips
4. 生动有趣的描述，像朋友在分享经验
5. 关注当下的热门趋势和季节性亮点

请用中文回复。为目的地生成一个完整的 **${dayCount} 天** 行程（每天 8:00-22:00），格式必须严格遵循 JSON schema。

重要：你正在为高德地图生成行程数据。为了确保前端能准确在地图上定位每个地点，请严格遵守以下规则：

【地点精确性】
- **所有活动必须严格位于目的地城市及所属区县范围内，禁止推荐其他城市的地点**
- name 必须是该地点在高德地图上的官方完整名称（含分店/入口/楼栋），如"洪崖洞民俗风貌区(11层)"而非"洪崖洞"
- city 字段必须与目的地城市一致（如"重庆市"、"成都市"）
- address 必须是高德地图可检索的详细地址，格式：区名+街道+门牌号，如"渝中区嘉陵江滨江路88号"
- 禁止模糊地址：不允许"附近"、"旁边"、"周边"、"步行街内"等无法定位的描述
- 地名和地址必须是真实存在的，宁可少推荐也不要编造不存在的地点

【图片搜索关键词】
- photoSpots 的 searchKeyword 必须是该地点的标准英文名称，用于 Unsplash 图片搜索
- searchKeyword 要具体到景点本身，如 "Hongyadong Chongqing" 而非 "Chongqing night view"

- 如果你对某个地点的地址非常确定，标记 "status": "verified"；如果不完全确定，标记 "status": "unverified"
- 不需要提供坐标（lat/lon），坐标由系统通过高德地图自动查询

{
  "locationName": "目的地名称（城市+核心区域，如'北京市东城区'）",
  "days": [
    {
      "dayTitle": "第一天主题，如'经典皇城线'",
      "morning": {
        "timeRange": "8:00 - 12:00",
        "title": "上午主题",
        "activities": [
          {
            "name": "故宫博物院-午门",
            "city": "北京市",
            "address": "东城区景山前街4号",
            "transport": "地铁1号线天安门东站",
            "status": "verified"
          }
        ]
      },
      "lunch": {
        "timeRange": "12:00 - 13:30",
        "title": "午餐推荐",
        "activities": [
          {
            "name": "四季民福烤鸭店（故宫店）",
            "city": "北京市",
            "address": "东城区南池子大街32号",
            "transport": "步行5分钟",
            "status": "verified"
          }
        ]
      },
      "afternoon": {
        "timeRange": "13:30 - 17:00",
        "title": "下午主题",
        "activities": [
          {
            "name": "景山公园-万春亭",
            "city": "北京市",
            "address": "西城区景山西街44号",
            "transport": "步行8分钟",
            "status": "verified"
          }
        ]
      },
      "dinner": {
        "timeRange": "17:30 - 19:00",
        "title": "晚餐推荐",
        "activities": [
          {
            "name": "南锣鼓巷",
            "city": "北京市",
            "address": "东城区南锣鼓巷胡同",
            "transport": "地铁6号线南锣鼓巷站",
            "status": "verified"
          }
        ]
      },
      "evening": {
        "timeRange": "19:00 - 22:00",
        "title": "晚间主题",
        "activities": [
          {
            "name": "什刹海",
            "city": "北京市",
            "address": "西城区什刹海",
            "transport": "步行10分钟",
            "status": "verified"
          }
        ]
      }
    }
  ],
  "transportationTips": ["交通建议1", "交通建议2", "交通建议3"],
  "photoSpots": [
    {
      "name": "故宫角楼",
      "city": "北京市",
      "address": "东城区故宫东角楼",
      "description": "为什么值得拍",
      "tip": "拍摄技巧或最佳时间",
      "searchKeyword": "Forbidden City Corner Tower Beijing",
      "status": "verified"
    }
  ],
  "trendingNotes": ["小红书热门笔记风格点评1", "点评2"]
}

要求：
- days 数组长度必须为 ${dayCount}，每天有不同的 dayTitle 主题
- 每天每个时段 2-3 个具体活动，必须选择该地真实存在的地点（景点、餐厅、街区等）
- 每个活动必须包含 name、city、address、status 四个字段
- name 必须是高德地图可搜索到的官方全称，包含分店名/入口名（如"星巴克(解放碑步行街店)"而非"星巴克"）
- name 必须是官方全称，禁止使用简称或口语化名称
- address 必须是高德地图可定位的精确地址：区名+街道+门牌号（如"渝中区嘉陵江滨江路88号"），不允许只写区名或泛泛的"步行街内"
- status："verified" 表示你对地址很确定，"unverified" 表示不太确定
- transport 字段说明到达方式（地铁X号线XX站 / 步行X分钟 / 打车约X分钟 / 公交X路）
- photoSpots 至少 2-3 个，每个必须包含 name、city、address、searchKeyword、status 字段
- searchKeyword 为该地点的标准英文名称，如 "West Lake Hangzhou"
- transportationTips 至少 2 条
- trendingNotes 至少 2 条带小红书风格的点评
- 所有内容用中文
- 只返回 JSON，不要其他文字`;
}

export async function generateItinerary(locationName: string, lat: number, lon: number, dayCount: number): Promise<MultiDayItinerary> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const response = await fetch(DEEPSEEK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: buildSystemPrompt(dayCount) },
        {
          role: 'user',
          content: `请为以下目的地生成 ${dayCount} 天旅行攻略（每天 8:00-22:00），每个活动给出真实具体的地名：\n\n目的地：${locationName}\n坐标：${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 8192,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const msg = (errBody as { error?: { message?: string } }).error?.message || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const text: string = data.choices?.[0]?.message?.content || '';
  return parseItineraryResponse(text);
}

export function hasApiKey(): boolean {
  return getApiKey() !== null;
}

export async function generateItinerarySafe(
  locationName: string,
  lat: number,
  lon: number,
  dayCount: number,
): Promise<MultiDayItinerary> {
  try {
    return await generateItinerary(locationName, lat, lon, dayCount);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'NO_API_KEY') {
      throw new Error('NO_API_KEY');
    }
    if (msg.includes('401') || msg.includes('invalid') || msg.includes('Authentication')) {
      throw new Error('NO_API_KEY');
    }
    console.warn('AI generation failed, using fallback:', msg);
    return generateFallbackItinerary(locationName, dayCount);
  }
}

const CHAT_SYSTEM_PROMPT = `你是一个小红书旅行规划助手，你的任务是根据用户的要求修改当前的旅行攻略。

你会收到当前的完整行程 JSON，以及用户的修改需求。请：
1. 用友好、小红书风格的语气回复用户（中文，2-4句话）
2. 然后输出完整的修改后 JSON，用 \`\`\`json 代码块包裹

注意：
- 保持 JSON 结构完整，包含所有天（days 数组）和所有时段（morning/lunch/afternoon/dinner/evening）
- 每个活动必须包含 name、city、address、status、transport 字段
- 地名必须是官方全称，address 尽可能详细（至少区级）
- status："verified" 表示地址确定，"unverified" 表示不确定
- 禁止使用模糊词如'附近'、'旁边'、'那个'等
- photoSpots、transportationTips、trendingNotes 也要保持完整
- 时段时间范围可以调整但保持合理
- days 数组长度保持不变

回复格式示例：
好的！我已经把第二天的午餐换成你想要的火锅店～

\`\`\`json
{ ... 完整JSON ... }
\`\`\``;

export async function chatModifyItinerary(
  currentItinerary: Record<string, unknown>,
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
): Promise<{ reply: string; itinerary: Record<string, unknown> | null }> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('NO_API_KEY');

  const messages: { role: string; content: string }[] = [
    { role: 'system', content: CHAT_SYSTEM_PROMPT },
  ];

  for (const msg of conversationHistory) {
    messages.push(msg);
  }

  messages.push({
    role: 'user',
    content: `当前行程 JSON：\n${JSON.stringify(currentItinerary, null, 2)}\n\n用户要求：${userMessage}`,
  });

  const response = await fetch(DEEPSEEK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages,
      max_tokens: 8192,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const msg = (errBody as { error?: { message?: string } }).error?.message || `HTTP ${response.status}`;
    throw new Error(msg);
  }

  const data = await response.json();
  const text: string = data.choices?.[0]?.message?.content || '';

  let itinerary: Record<string, unknown> | null = null;
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try {
      itinerary = JSON.parse(jsonMatch[1].trim()) as Record<string, unknown>;
    } catch {
      console.warn('[Chat] failed to parse JSON from AI response');
    }
  }

  const reply = text.replace(/```json[\s\S]*?```/, '').trim();

  return { reply: reply || '已更新行程～', itinerary };
}
