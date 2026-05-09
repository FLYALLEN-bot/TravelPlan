import type { ItineraryData } from '../types/itinerary';
import { parseItineraryResponse, generateFallbackItinerary } from '../utils/formatItinerary';

const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

function getApiKey(): string | null {
  const envKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (envKey) return envKey;
  const storedKey = localStorage.getItem('deepseek_api_key');
  if (storedKey) return storedKey;
  return null;
}

const SYSTEM_PROMPT = `你是一个小红书（RED）旅行内容专家，擅长创作精美、实用的一天旅行攻略。你的攻略风格深受小红书用户喜爱，强调：

1. 出片率高的打卡点（拍照好看的地方）
2. 隐藏的小众店铺和本地人才知道的美食
3. 实用的交通和游玩 tips
4. 生动有趣的描述，像朋友在分享经验
5. 关注当下的热门趋势和季节性亮点

请用中文回复。对于每个目的地，生成一个完整的一天行程（8:00-22:00），格式必须严格遵循 JSON schema。

注意：每个活动只需提供真实、具体的真实地名（name）和交通方式（transport），不需要提供坐标，坐标由系统自动查询。

{
  "locationName": "目的地名称",
  "morning": {
    "timeRange": "8:00 - 12:00",
    "title": "上午主题",
    "activities": [
      { "name": "故宫博物院", "transport": "地铁1号线天安门东站" }
    ]
  },
  "lunch": {
    "timeRange": "12:00 - 13:30",
    "title": "午餐推荐",
    "activities": [
      { "name": "四季民福烤鸭店", "transport": "步行5分钟" }
    ]
  },
  "afternoon": {
    "timeRange": "13:30 - 17:00",
    "title": "下午主题",
    "activities": [
      { "name": "景山公园", "transport": "步行8分钟" }
    ]
  },
  "dinner": {
    "timeRange": "17:30 - 19:00",
    "title": "晚餐推荐",
    "activities": [
      { "name": "南锣鼓巷小吃街", "transport": "地铁6号线南锣鼓巷站" }
    ]
  },
  "evening": {
    "timeRange": "19:00 - 22:00",
    "title": "晚间主题",
    "activities": [
      { "name": "什刹海酒吧街", "transport": "步行10分钟" }
    ]
  },
  "transportationTips": ["交通建议1", "交通建议2", "交通建议3"],
  "photoSpots": [
    { "name": "打卡点名称", "description": "为什么值得拍", "tip": "拍摄技巧或最佳时间" }
  ],
  "trendingNotes": ["小红书热门笔记风格点评1", "点评2"]
}

要求：
- 每个时段 2-3 个具体活动，尽量选择该地真实存在的地点（景点、餐厅、街区等）
- 地名必须具体、真实，包含标志性景点、知名餐厅、热门街区
- transport 字段说明到达方式（地铁X号线XX站 / 步行X分钟 / 打车约X分钟 / 公交X路）
- photoSpots 至少 2-3 个
- transportationTips 至少 2 条
- trendingNotes 至少 2 条带小红书风格的点评
- 所有内容用中文
- 只返回 JSON，不要其他文字`;

export async function generateItinerary(locationName: string, lat: number, lon: number): Promise<ItineraryData> {
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
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `请为以下目的地生成一天旅行攻略（8:00-22:00），每个活动给出真实具体的地名：\n\n目的地：${locationName}\n坐标：${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 4096,
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
  lon: number
): Promise<ItineraryData> {
  try {
    return await generateItinerary(locationName, lat, lon);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'NO_API_KEY') {
      throw new Error('NO_API_KEY');
    }
    // Auth errors → re-throw so UI can show API key modal
    if (msg.includes('401') || msg.includes('invalid') || msg.includes('Authentication')) {
      throw new Error('NO_API_KEY');
    }
    console.warn('AI generation failed, using fallback:', msg);
    return generateFallbackItinerary(locationName);
  }
}

const CHAT_SYSTEM_PROMPT = `你是一个小红书旅行规划助手，你的任务是根据用户的要求修改当前的旅行攻略。

你会收到当前的完整行程 JSON，以及用户的修改需求。请：
1. 用友好、小红书风格的语气回复用户（中文，2-4句话）
2. 然后输出完整的修改后 JSON，用 \`\`\`json 代码块包裹

注意：
- 保持 JSON 结构完整，包含所有时段（morning/lunch/afternoon/dinner/evening）
- 每个活动只需提供 name 和 transport，不需要坐标
- photoSpots、transportationTips、trendingNotes 也要保持完整
- 地名必须具体真实
- 时段时间范围可以调整但保持合理

回复格式示例：
好的！我已经把午餐换成你想要的火锅店，下午增加了一个艺术馆～

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
      max_tokens: 4096,
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
