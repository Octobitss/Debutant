// ==========================================================================
// One-time generator for placeholder WebP assets so the site never ships
// with broken <img> references before real photography is supplied.
// Run with: npm run placeholders
// ==========================================================================

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "assets", "images");

const PALETTE = {
  primary: "#925A5D",
  primaryDark: "#6F4245",
  secondary: "#CC96BB",
  secondaryLight: "#E3BFD8",
  dark: "#4E3B4A",
  darkDeep: "#241A24",
  gardenDeep: "#1F2A20",
  gardenMoss: "#3A4A3A",
  cream: "#F8ECE7",
  champagne: "#E9D9B8",
  mirrorGlass: "#DCE8E4"
};

function petalCluster(cx, cy, scale, color) {
  return `
    <g transform="translate(${cx} ${cy}) scale(${scale})" opacity="0.92">
      ${[0, 60, 120, 180, 240, 300]
        .map(
          (angle) => `
        <ellipse cx="0" cy="-14" rx="7" ry="14" fill="${color}"
          transform="rotate(${angle})" opacity="0.85" />`
        )
        .join("")}
      <circle r="5.5" fill="${PALETTE.champagne}" />
    </g>`;
}

function archFrame(cx, cy, w, h, color) {
  const rx = w / 2;
  return `
    <path d="M ${cx - rx} ${cy + h / 2}
             L ${cx - rx} ${cy - h / 2 + rx}
             A ${rx} ${rx} 0 0 1 ${cx + rx} ${cy - h / 2 + rx}
             L ${cx + rx} ${cy + h / 2} Z"
      fill="none" stroke="${color}" stroke-width="2" opacity="0.7" />`;
}

function svgDoc(width, height, inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${inner}
  </svg>`;
}

async function render(name, width, height, inner) {
  const svg = svgDoc(width, height, inner);
  const outPath = path.join(OUT_DIR, name);
  await sharp(Buffer.from(svg)).webp({ quality: 95, nearLossless: true }).toFile(outPath);
  console.log(`  ✓ ${name}`);
}

function debutantePortraitSvg(w, h) {
  return `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${PALETTE.secondary}" />
        <stop offset="100%" stop-color="${PALETTE.primaryDark}" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="35%" r="60%">
        <stop offset="0%" stop-color="${PALETTE.mirrorGlass}" stop-opacity="0.35" />
        <stop offset="100%" stop-color="${PALETTE.dark}" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)" />
    <rect width="${w}" height="${h}" fill="url(#glow)" />
    ${archFrame(w / 2, h / 2, w * 0.72, h * 0.82, PALETTE.champagne)}
    <circle cx="${w / 2}" cy="${h * 0.4}" r="${w * 0.2}" fill="none" stroke="${PALETTE.cream}" stroke-width="2" opacity="0.8" />
    <text x="50%" y="43%" text-anchor="middle" dominant-baseline="middle"
      font-family="Georgia, 'Times New Roman', serif" font-size="${Math.round(w * 0.2)}"
      fill="${PALETTE.cream}">T</text>
    ${petalCluster(w * 0.5, h * 0.68, 1.1, PALETTE.cream)}
    <text x="50%" y="92%" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
      font-size="${Math.round(w * 0.032)}" letter-spacing="3" fill="${PALETTE.dark}" opacity="0.75">REPLACE WITH PORTRAIT</text>
  `;
}

function venueSvg(w, h, tint, icon) {
  return `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${tint[0]}" />
        <stop offset="100%" stop-color="${tint[1]}" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)" />
    <g transform="translate(${w / 2} ${h * 0.44})" stroke="${PALETTE.cream}" stroke-width="2.4" fill="none" opacity="0.9">
      ${icon}
    </g>
    <text x="50%" y="86%" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
      font-size="${Math.round(w * 0.03)}" letter-spacing="3" fill="${PALETTE.cream}" opacity="0.8">VILLA ANNABELLE — REPLACE ME</text>
  `;
}

function dresscodeSvg(w, h, tint, icon) {
  return `
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${tint[0]}" />
        <stop offset="100%" stop-color="${tint[1]}" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#bg)" />
    <g transform="translate(${w / 2} ${h * 0.42})" stroke="${PALETTE.cream}" stroke-width="2.6" fill="none" opacity="0.92">
      ${icon}
    </g>
    ${petalCluster(w * 0.5, h * 0.82, 1, PALETTE.cream)}
  `;
}

const DRESS_ARCH = `
  <path d="M-60 90 C -60 10, -30 -60, 0 -60 C 30 -60, 60 10, 60 90 Z" />
  <line x1="-60" y1="90" x2="60" y2="90" />
`;

const SUIT_ICON = `
  <path d="M-45 90 L-30 -50 L-14 -70 L14 -70 L30 -50 L45 90 Z" />
  <path d="M-14 -70 L0 -30 L14 -70" />
  <line x1="0" y1="-30" x2="0" y2="30" />
`;

const VENUE_ICONS = [
  `<path d="M-70 60 C -40 20, -20 20, 0 60 C 20 20, 40 20, 70 60" />
   <line x1="0" y1="60" x2="0" y2="-10" />
   <circle cx="0" cy="-30" r="18" />`,
  `<path d="M-70 70 L-70 -10 L0 -70 L70 -10 L70 70 Z" />
   <line x1="-70" y1="70" x2="70" y2="70" />
   <line x1="-30" y1="70" x2="-30" y2="10" />
   <line x1="30" y1="70" x2="30" y2="10" />`,
  `<path d="M-60 40 Q 0 -10 60 40" />
   <line x1="-60" y1="40" x2="-60" y2="70" />
   <line x1="60" y1="40" x2="60" y2="70" />
   <circle cx="0" cy="55" r="14" />`
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  console.log(`Generating placeholder art in ${path.relative(process.cwd(), OUT_DIR)}\n`);

  await render("debutante-portrait.webp", 900, 1200, debutantePortraitSvg(900, 1200));

  await render(
    "venue-1.webp",
    1200,
    900,
    venueSvg(1200, 900, [PALETTE.gardenDeep, PALETTE.dark], VENUE_ICONS[0])
  );
  await render(
    "venue-2.webp",
    1200,
    900,
    venueSvg(1200, 900, [PALETTE.primary, PALETTE.darkDeep], VENUE_ICONS[1])
  );
  await render(
    "venue-3.webp",
    1200,
    900,
    venueSvg(1200, 900, [PALETTE.secondary, PALETTE.primaryDark], VENUE_ICONS[2])
  );

  await render(
    "dresscode-women.webp",
    900,
    1200,
    dresscodeSvg(900, 1200, [PALETTE.secondary, PALETTE.dark], DRESS_ARCH)
  );
  await render(
    "dresscode-men.webp",
    900,
    1200,
    dresscodeSvg(900, 1200, [PALETTE.primary, PALETTE.darkDeep], SUIT_ICON)
  );

  console.log(
    "\nDone. Replace any of these files in public/assets/images/ at any time —\nthe app references the filenames directly, so no code changes are needed."
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
