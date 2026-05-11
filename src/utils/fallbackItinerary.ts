/**
 * Generate a fallback itinerary when AI generation fails.
 */

import type { MultiDayItinerary, DayPlan } from '../types/itinerary';

const dayThemes = ['经典路线', '深度探索', '小众体验', '自然风光', '人文历史', '美食之旅', '休闲漫游'];

export function generateFallbackItinerary(locationName: string, dayCount: number = 1): MultiDayItinerary {
  const fallbackActivities = {
    morning: [
      { name: `${locationName}标志性景点`, transport: '地铁', status: 'unverified' as const },
      { name: '周边特色街区', transport: '步行', status: 'unverified' as const },
      { name: '当地人气咖啡馆', transport: '步行', status: 'unverified' as const },
    ],
    lunch: [
      { name: '本地人气餐厅', transport: '步行', status: 'unverified' as const },
      { name: '特色美食街', transport: '步行', status: 'unverified' as const },
    ],
    afternoon: [
      { name: '博物馆或文化场馆', transport: '地铁', status: 'unverified' as const },
      { name: '小红书热推打卡点', transport: '步行', status: 'unverified' as const },
      { name: '当地手工艺体验馆', transport: '步行', status: 'unverified' as const },
    ],
    dinner: [
      { name: '评价极佳的本地餐厅', transport: '打车', status: 'unverified' as const },
      { name: '夜市美食摊位', transport: '步行', status: 'unverified' as const },
    ],
    evening: [
      { name: '城市最佳夜景点', transport: '打车', status: 'unverified' as const },
      { name: '特色酒吧或茶馆', transport: '步行', status: 'unverified' as const },
      { name: '夜间特色店铺', transport: '步行', status: 'unverified' as const },
    ],
  };

  const days: DayPlan[] = [];
  for (let d = 0; d < dayCount; d++) {
    days.push({
      dayTitle: dayThemes[d % dayThemes.length],
      morning: { timeRange: '8:00 - 12:00', title: '上午探索', activities: fallbackActivities.morning.map((a) => ({ ...a })) },
      lunch: { timeRange: '12:00 - 13:30', title: '午餐时光', activities: fallbackActivities.lunch.map((a) => ({ ...a })) },
      afternoon: { timeRange: '13:30 - 17:00', title: '下午深度游', activities: fallbackActivities.afternoon.map((a) => ({ ...a })) },
      dinner: { timeRange: '17:30 - 19:00', title: '晚餐推荐', activities: fallbackActivities.dinner.map((a) => ({ ...a })) },
      evening: { timeRange: '19:00 - 22:00', title: '晚间休闲', activities: fallbackActivities.evening.map((a) => ({ ...a })) },
      routeStops: [],
    });
  }

  return {
    locationName,
    days,
    transportationTips: [
      '建议使用地铁/公交等公共交通，方便快捷',
      '下载当地地图离线包，避免网络问题',
      '打车软件提前安装注册',
    ],
    photoSpots: [
      { name: '城市地标', description: '最具代表性的城市景观', tip: '建议清晨或黄昏时分前往，光线最佳', status: 'unverified' as const },
      { name: '隐藏街角', description: '充满当地生活气息的街道', tip: '使用人像模式拍摄，背景虚化效果极佳', status: 'unverified' as const },
    ],
    trendingNotes: [
      '这里是小红书用户热推的目的地，记得提前做好功课',
      '周末人流量较大，建议工作日前往体验更佳',
      '关注当地天气，做好防晒或防雨准备',
    ],
  };
}
