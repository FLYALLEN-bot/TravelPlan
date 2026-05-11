/**
 * Encapsulates the chat modification business logic:
 * API call → response parsing → itinerary merging.
 */

import { useCallback, useRef } from 'react';
import type { ChatMessage, MultiDayItinerary } from '../types/itinerary';
import { chatModifyItinerary } from '../api/anthropic';
import { parseItineraryResponse } from '../utils/formatItinerary';

interface ChatResult {
  reply: string;
  proposedItinerary: MultiDayItinerary | null;
}

export function useChatModify() {
  // Refs to avoid stale closures
  const messagesRef = useRef<ChatMessage[]>([]);
  const itineraryDataRef = useRef<MultiDayItinerary | null>(null);

  const updateRefs = useCallback((messages: ChatMessage[], itinerary: MultiDayItinerary) => {
    messagesRef.current = messages;
    itineraryDataRef.current = itinerary;
  }, []);

  const sendMessage = useCallback(async (userText: string): Promise<ChatResult> => {
    const currentMessages = messagesRef.current;
    const currentItinerary = itineraryDataRef.current;
    if (!currentItinerary) {
      return { reply: '行程数据不可用', proposedItinerary: null };
    }

    const history = currentMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.text,
    }));

    // Strip routeStops from the JSON sent to AI (it's rebuilt from geocoding)
    const clean = {
      ...currentItinerary,
      days: currentItinerary.days.map(({ routeStops, ...rest }) => rest),
    } as Record<string, unknown>;

    const result = await chatModifyItinerary(clean, userText, history);

    let proposedItinerary: MultiDayItinerary | null = null;
    if (result.itinerary) {
      proposedItinerary = parseAiItinerary(result.itinerary, currentItinerary);
    }

    return { reply: result.reply, proposedItinerary };
  }, []);

  return { updateRefs, sendMessage };
}

/**
 * Try to parse AI's itinerary response. Falls back to merging with current itinerary.
 */
function parseAiItinerary(
  aiData: Record<string, unknown>,
  currentItinerary: MultiDayItinerary,
): MultiDayItinerary | null {
  // Strategy 1: strict parse
  try {
    return parseItineraryResponse(JSON.stringify(aiData));
  } catch (e) {
    console.warn('[Chat] strict parse failed, merging with current itinerary:', e);
  }

  // Strategy 2: merge AI fields into current itinerary
  try {
    const merged: MultiDayItinerary = { ...currentItinerary };
    if (typeof aiData.locationName === 'string') merged.locationName = aiData.locationName;
    if (Array.isArray(aiData.days)) {
      (aiData.days as Record<string, unknown>[]).forEach((aiDay, di) => {
        if (!merged.days[di]) return;
        for (const key of ['morning', 'lunch', 'afternoon', 'dinner', 'evening'] as const) {
          const aiSlot = aiDay[key] as Record<string, unknown> | undefined;
          if (!aiSlot) continue;
          if (typeof aiSlot.timeRange === 'string') merged.days[di][key].timeRange = aiSlot.timeRange;
          if (typeof aiSlot.title === 'string') merged.days[di][key].title = aiSlot.title;
          if (Array.isArray(aiSlot.activities)) {
            merged.days[di][key].activities = (aiSlot.activities as unknown[]).map((a: unknown) => {
              if (typeof a === 'string') return { name: a };
              if (typeof a === 'object' && a !== null) {
                const obj = a as Record<string, unknown>;
                return { name: String(obj.name || ''), transport: typeof obj.transport === 'string' ? obj.transport : undefined };
              }
              return { name: String(a) };
            });
          }
        }
      });
    }
    if (Array.isArray(aiData.transportationTips)) merged.transportationTips = aiData.transportationTips as string[];
    if (Array.isArray(aiData.photoSpots)) merged.photoSpots = aiData.photoSpots as typeof merged.photoSpots;
    if (Array.isArray(aiData.trendingNotes)) merged.trendingNotes = aiData.trendingNotes as string[];
    return merged;
  } catch {
    console.warn('[Chat] merge also failed, discarding');
    return null;
  }
}
