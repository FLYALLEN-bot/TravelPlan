import L from 'leaflet';

export function createPinIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="position:relative;width:36px;height:48px;">
      <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glassShadow" x="-30%" y="-10%" width="160%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#f59e0b" flood-opacity="0.25"/>
          </filter>
        </defs>
        <path d="M18 0C8.06 0 0 7.84 0 17.5C0 30.63 18 48 18 48S36 30.63 36 17.5C36 7.84 27.94 0 18 0Z" fill="#f59e0b" filter="url(#glassShadow)"/>
        <circle cx="18" cy="17" r="6" fill="white" opacity="0.95"/>
        <circle cx="18" cy="17" r="2.5" fill="#f59e0b"/>
      </svg>
    </div>`,
    className: '',
    iconSize: [36, 48],
    iconAnchor: [18, 48],
    popupAnchor: [0, -48],
  });
}
