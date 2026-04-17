import L from "leaflet";

export const createQuayWaypointMarker = (_name: string) => {
  return L.divIcon({
    className: "quay-waypoint-marker",
    html: `<div style="
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
        padding: 2px;
      ">
        <img src="/ferge.svg" style="width: 20px; height: 20px; border-radius: 50%; display: block;" />
      </div>`,
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
