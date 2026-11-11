import L from "leaflet";

// Ferry glyph drawn for a 24×24 box so it reads at pin size (hull, cabin, bridge, windows).
const FERRY_GLYPH = (size: number, windowColor: string) => `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" style="display:block">
    <path fill="#fff" d="M2.5 14.5h19l-2.6 4.3a1.6 1.6 0 0 1-1.37.77H6.47a1.6 1.6 0 0 1-1.37-.77L2.5 14.5Z"/>
    <rect fill="#fff" x="5" y="10" width="14" height="4" rx="0.8"/>
    <rect fill="#fff" x="8.5" y="6.5" width="7" height="3" rx="0.7"/>
    <rect fill="${windowColor}" x="7" y="11.3" width="2" height="1.4" rx="0.3"/>
    <rect fill="${windowColor}" x="11" y="11.3" width="2" height="1.4" rx="0.3"/>
    <rect fill="${windowColor}" x="15" y="11.3" width="2" height="1.4" rx="0.3"/>
  </svg>`;

function buildQuayPin(selected: boolean): L.DivIcon {
  const size = selected ? 44 : 30;
  const glyph = selected ? 30 : 20;
  const bg = selected ? "#011638" : "#2569A3";
  return L.divIcon({
    className: "quay-pin-marker",
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${bg};border:2px solid #fff;box-sizing:border-box;
        box-shadow:0 1px 4px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;cursor:pointer;
      ">${FERRY_GLYPH(glyph, bg)}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Icons are immutable, so build each variant once and share it across all ~366 markers.
export const QUAY_PIN = buildQuayPin(false);
export const QUAY_PIN_SELECTED = buildQuayPin(true);

export const createUserMarker = () => {
  return L.divIcon({
    className: "user-marker",
    html: `
      <div style="position:relative;width:56px;height:56px;">
        <div style="
          position:absolute;
          top:50%;
          left:50%;
          width:28px;
          height:28px;
          border-radius:50%;
          background:rgba(59,130,246,0.4);
          animation:user-location-pulse 2s ease-out infinite;
        "></div>
        <div style="
          position:absolute;
          top:50%;
          left:50%;
          transform:translate(-50%,-50%);
          width:20px;
          height:20px;
          background:#3b82f6;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 2px 10px rgba(59,130,246,0.45);
        "></div>
      </div>
    `,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
};
