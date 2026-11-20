// Builds the favicon set from the ferry's wheelhouse (public/ferge-light.svg):
// app/favicon.ico (16/32/48), app/icon.svg, app/apple-icon.png (180) and public/icon-{192,512}.png.
// Run from the repo root: node packages/web/scripts/build-icons.mjs
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const NAVY = "#011638", SKY = "#92D3F5";
// Wheelhouse from ferge-light.svg (source coordinates), on a white deck band. Antenna strokes
// are thickened so they survive at 32px.
const wheelhouse = `
    <rect x="0" y="41" width="153" height="40" fill="white"/>
    <path d="M65.8335 30.014H87.1365L94.985 42.0213H57.985L65.8335 30.014Z" fill="white"/>
    <path d="M87.1427 31.0614L65.8564 31.1883L57.9365 18.2157L94.9074 17.9952L87.1427 31.0614Z" fill="white"/>
    <line x1="75.985" y1="19.0073" x2="75.985" y2="6" stroke-width="2.6" stroke="white"/>
    <line x1="70.485" y1="12.5037" x2="81.485" y2="12.5037" stroke-width="1.6" stroke="white"/>
    <line x1="71.985" y1="9.20183" x2="79.985" y2="9.20183" stroke-width="1.6" stroke="white"/>
    <g opacity="0.85" fill="${NAVY}">
      <path d="M70.1291 27.0122H67.4097C66.7636 27.0122 66.235 26.5072 66.235 25.89V22.1307C66.235 21.5135 66.7636 21.0085 67.4097 21.0085H70.1291C70.7752 21.0085 71.3038 21.5135 71.3038 22.1307V25.89C71.3038 26.5128 70.781 27.0122 70.1291 27.0122Z"/>
      <path d="M77.4697 27.0122H74.7503C74.1042 27.0122 73.5756 26.5072 73.5756 25.89V22.1307C73.5756 21.5135 74.1042 21.0085 74.7503 21.0085H77.4697C78.1158 21.0085 78.6444 21.5135 78.6444 22.1307V25.89C78.6444 26.5128 78.1217 27.0122 77.4697 27.0122Z"/>
      <path d="M84.8103 27.0122H82.0909C81.4448 27.0122 80.9162 26.5072 80.9162 25.89V22.1307C80.9162 21.5135 81.4448 21.0085 82.0909 21.0085H84.8103C85.4564 21.0085 85.985 21.5135 85.985 22.1307V25.89C85.985 26.5128 85.4622 27.0122 84.8103 27.0122Z"/>
    </g>
    <path fill="${NAVY}" d="M76.4815 33.0193C82.2806 33.0193 86.9815 37.4879 86.9815 43.0004C86.9815 48.513 82.2806 52.9815 76.4815 52.9815C70.6823 52.9815 65.9815 48.513 65.9815 43.0004C65.9815 37.4879 70.6823 33.0193 76.4815 33.0193ZM76.4815 35.0156C74.2537 35.0156 72.1171 35.8568 70.5418 37.3543C68.9665 38.8517 68.0815 40.8827 68.0815 43.0004C68.0815 45.1181 68.9665 47.1491 70.5418 48.6466C72.1171 50.144 74.2537 50.9853 76.4815 50.9853C78.7093 50.9853 80.8459 50.144 82.4212 48.6466C83.9965 47.1491 84.8815 45.1181 84.8815 43.0004C84.8815 40.8827 83.9965 38.8517 82.4212 37.3543C80.8459 35.8568 78.7093 35.0156 76.4815 35.0156ZM76.4815 37.0118C76.7387 37.0118 76.9869 37.1016 77.1791 37.264C77.3713 37.4265 77.4941 37.6503 77.5241 37.8931L77.5315 38.0099V42.5872L80.3738 45.2891C80.5622 45.4687 80.6715 45.7097 80.6796 45.9632C80.6878 46.2167 80.5941 46.4636 80.4177 46.6538C80.2412 46.844 79.9953 46.9632 79.7297 46.9873C79.4641 47.0113 79.1989 46.9384 78.9878 46.7832L78.8891 46.7004L75.7391 43.7061C75.5759 43.5508 75.4711 43.3488 75.4409 43.1312L75.4315 43.0004V38.0099C75.4315 37.7452 75.5421 37.4913 75.739 37.3041C75.9359 37.1169 76.203 37.0118 76.4815 37.0118Z"/>`;

// 64-unit square: navy border (6 units), sky inside, the wheelhouse centred on the deck.
// `outerRadius` 0 for the Apple icon (iOS rounds the corners itself and shows transparency as black).
const icon = (outerRadius = 14) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs><clipPath id="inner"><rect x="6" y="6" width="52" height="52" rx="9"/></clipPath></defs>
  <rect width="64" height="64" rx="${outerRadius}" fill="${NAVY}"/>
  <g clip-path="url(#inner)">
    <rect x="6" y="6" width="52" height="52" fill="${SKY}"/>
    <g transform="translate(-40.675 4.3) scale(0.95)">${wheelhouse}
    </g>
  </g>
</svg>
`;

const web = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const png = (svg, size) => sharp(Buffer.from(svg), { density: 72 * size / 64 * 4 }).resize(size, size).png().toBuffer();

writeFileSync(`${web}/app/icon.svg`, icon());
writeFileSync(`${web}/app/apple-icon.png`, await png(icon(0), 180));
writeFileSync(`${web}/public/icon-192.png`, await png(icon(), 192));
writeFileSync(`${web}/public/icon-512.png`, await png(icon(), 512));

// favicon.ico with PNG-encoded 16, 32 and 48 px images.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((s) => png(icon(), s)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((s, i) => {
  const e = 6 + 16 * i;
  header.writeUInt8(s, e); header.writeUInt8(s, e + 1); header.writeUInt8(0, e + 2); header.writeUInt8(0, e + 3);
  header.writeUInt16LE(1, e + 4); header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(images[i].length, e + 8); header.writeUInt32LE(offset, e + 12);
  offset += images[i].length;
});
writeFileSync(`${web}/app/favicon.ico`, Buffer.concat([header, ...images]));
