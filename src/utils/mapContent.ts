/**
 * Pure functions for generating map marker and InfoWindow HTML/SVG content.
 * Extracted from AMapView.tsx to separate content generation from map API logic.
 */

const slotColors: Record<string, string> = {
  morning: '#f59e0b',
  lunch: '#f43f5e',
  afternoon: '#2dd4bf',
  dinner: '#f97316',
  evening: '#818cf8',
};

/** HTML entity escape to prevent XSS from AI-generated content */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** SVG content for a numbered stop marker */
export function createStopMarkerSvg(index: number, timeSlot: string): string {
  const color = slotColors[timeSlot] || '#2dd4bf';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42">
    <defs>
      <filter id="ms-${index}">
        <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#000000" flood-opacity="0.45"/>
      </filter>
    </defs>
    <circle cx="21" cy="21" r="17" fill="${color}" stroke="#09090b" stroke-width="3" filter="url(#ms-${index})"/>
    <circle cx="21" cy="21" r="14" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
    <text x="21" y="27" text-anchor="middle" fill="#fafaf9" font-size="14" font-weight="800"
          stroke="#09090b" stroke-width="5" paint-order="stroke fill"
          font-family="system-ui,-apple-system,sans-serif">${index + 1}</text>
  </svg>`;
}

/** SVG content for the location pin marker */
export function createPinIconSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
    <path d="M18 0C8.06 0 0 8.06 0 18c0 12.3 16.2 28.1 16.9 28.8.38.35.7.5 1.1.5.4 0 .72-.15 1.1-.5C19.8 46.1 36 30.3 36 18 36 8.06 27.94 0 18 0z" fill="#f59e0b" stroke="#09090b" stroke-width="2"/>
    <circle cx="18" cy="17" r="8" fill="#09090b"/>
    <circle cx="18" cy="17" r="5" fill="#f59e0b"/>
  </svg>`;
}

/** HTML content for a stop's InfoWindow */
export function createInfoWindowHtml(
  name: string,
  time: string | undefined,
  transport: string | undefined,
  uid: string,
): string {
  const safeName = escapeHtml(name);
  const safeTime = time ? escapeHtml(time) : '';
  const safeTransport = transport ? escapeHtml(transport) : '';

  return `<div data-iw id="${uid}" style="position:relative;background:rgba(255,106,0,0.45);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.2);border-radius:10px;padding:14px 36px 14px 14px;min-width:170px;box-shadow:0 4px 24px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.15);z-index:9999;">
    <style>#${uid} [data-iw-close]:hover{background:rgba(0,0,0,0.55)!important}</style>
    <button data-iw-close="${uid}" style="position:absolute;top:8px;right:8px;width:22px;height:22px;border-radius:50%;border:none;background:rgba(0,0,0,0.3);color:#fff;font-size:14px;line-height:22px;text-align:center;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.15s;">&times;</button>
    <h4 style="font-family:'Noto Sans SC',system-ui,sans-serif;font-weight:800;font-size:15px;color:#ffffff;margin:0 0 6px;padding:0;text-shadow:0 1px 3px rgba(0,0,0,0.6);">${safeName}</h4>
    ${safeTime ? `<p style="color:rgba(255,255,255,0.9);font-size:12px;margin:0 0 4px;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,0.5);"><span style="font-weight:800;">时间</span> ${safeTime}</p>` : ''}
    ${safeTransport ? `<p style="color:rgba(255,255,255,0.9);font-size:12px;margin:0;font-weight:600;text-shadow:0 1px 2px rgba(0,0,0,0.5);"><span style="font-weight:800;">交通</span> ${safeTransport}</p>` : ''}
    <div style="position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:8px solid rgba(255,106,0,0.45);"></div>
  </div>`;
}
