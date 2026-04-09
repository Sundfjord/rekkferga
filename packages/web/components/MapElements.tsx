import L from "leaflet";

export const createQuayWaypointMarker = (_name: string) => {
  return L.divIcon({
    className: "quay-waypoint-marker",
    html: `<div style="
        background-color: white;
        border: 3px solid #0ea5e9;
        border-radius: 50%;
        width: 14px;
        height: 14px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
};

export const createUserMarker = () => {
  return L.divIcon({
    className: "user-marker",
    html: `<div style="
        width: 20px;
        height: 20px;
        background-color: var(--color-secondary);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};
