import L from "leaflet";

// Shared marker shell — 32px circle with border and shadow
const markerShell = (inner: string) => `
  <div style="
    background-color: #42a5f5;
    border: 2.5px solid #011683;
    border-radius: 50%;
    width: 32px;
    height: 32px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.30);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  ">${inner}</div>`;

export const createQuayWaypointMarker = (_name: string) => {
  return L.divIcon({
    className: "quay-waypoint-marker",
    html: markerShell(
      `<img src="/ferge.svg" style="width: 20px; height: 20px; border-radius: 50%; display: block;" />`
    ),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const createUserMarker = () => {
  return L.divIcon({
    className: "user-marker",
    html: `
      <div style="position:relative;width:40px;height:40px;">
        <div style="
          position:absolute;
          top:50%;
          left:50%;
          width:20px;
          height:20px;
          border-radius:50%;
          background:rgba(59,130,246,0.4);
          animation:user-location-pulse 2s ease-out infinite;
        "></div>
        <div style="
          position:absolute;
          top:50%;
          left:50%;
          transform:translate(-50%,-50%);
          width:14px;
          height:14px;
          background:#3b82f6;
          border:2.5px solid white;
          border-radius:50%;
          box-shadow:0 2px 10px rgba(59,130,246,0.45);
        "></div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export const createDestinationMarker = () => {
  // Oversized 6x6 checkered grid — the shell's overflow:hidden + border-radius clips it into the circle
  const checkerSvg = `
    <svg width="40" height="40" viewBox="0 0 6 6" style="display:block;flex-shrink:0;" xmlns="http://www.w3.org/2000/svg">
      <rect width="6" height="6" fill="white"/>
      <rect width="1" height="1" x="0" y="0" fill="#011638"/>
      <rect width="1" height="1" x="2" y="0" fill="#011638"/>
      <rect width="1" height="1" x="4" y="0" fill="#011638"/>
      <rect width="1" height="1" x="1" y="1" fill="#011638"/>
      <rect width="1" height="1" x="3" y="1" fill="#011638"/>
      <rect width="1" height="1" x="5" y="1" fill="#011638"/>
      <rect width="1" height="1" x="0" y="2" fill="#011638"/>
      <rect width="1" height="1" x="2" y="2" fill="#011638"/>
      <rect width="1" height="1" x="4" y="2" fill="#011638"/>
      <rect width="1" height="1" x="1" y="3" fill="#011638"/>
      <rect width="1" height="1" x="3" y="3" fill="#011638"/>
      <rect width="1" height="1" x="5" y="3" fill="#011638"/>
      <rect width="1" height="1" x="0" y="4" fill="#011638"/>
      <rect width="1" height="1" x="2" y="4" fill="#011638"/>
      <rect width="1" height="1" x="4" y="4" fill="#011638"/>
      <rect width="1" height="1" x="1" y="5" fill="#011638"/>
      <rect width="1" height="1" x="3" y="5" fill="#011638"/>
      <rect width="1" height="1" x="5" y="5" fill="#011638"/>
    </svg>`;

  return L.divIcon({
    className: "destination-marker",
    html: markerShell(checkerSvg),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};
