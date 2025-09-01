import L from "leaflet";

export const createQuayMarker = (name: string) => {
  // Base measurements
  const iconWidth = 20; // SVG icon width
  const iconPadding = 10; // Left and right padding
  const gap = 5; // Gap between icon and text
  const textPadding = 8; // Additional padding around text
  const charWidth = 5.5; // Approximate width per character (adjust based on font)

  // Calculate total width
  const textWidth = name.length * charWidth;
  const totalWidth =
    iconWidth + iconPadding * 2 + gap + textWidth + textPadding * 2;

  // Ensure minimum width for very short names
  const minWidth = 60;
  const finalWidth = Math.max(totalWidth, minWidth);

  return L.divIcon({
    className: "quay-marker",
    html: `<div style="
            background-color: var(--color-primary);
            color: white;
            height: 32px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 5px;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            border: 2px solid white;
            padding: 5px 10px;
            white-space: nowrap;
            overflow: hidden;
        ">
            <div class="quay-marker-icon">
              <img src="/marker-ferge.svg" alt="Ferry" width="20" height="20" />
            </div>
            <div class="quay-marker-name" style="
              font-size: 12px;
              font-weight: 600;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: ${textWidth + textPadding * 2}px;
            ">
              ${name}
            </div>
        </div>`,
    iconSize: [finalWidth, 32],
    iconAnchor: [finalWidth / 2, 16], // Center the marker
    popupAnchor: [0, -16],
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
