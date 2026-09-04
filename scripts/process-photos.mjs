import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dirname, "..", "public", "assets", "images");

const JOBS = [
  { src: "debutante-portrait.jpeg", out: "debutante-portrait.webp", width: 900 },
  { src: "Important Image.jpeg", out: "loading-hero.webp", width: 1600 },
  { src: "Debutant's Image (1).jpeg", out: "debutant-gallery-1.webp", width: 700 },
  { src: "Debutant's Image (3).jpeg", out: "debutant-gallery-2.webp", width: 700 },
  { src: "Debutant's Image (4).jpeg", out: "debutant-gallery-3.webp", width: 700 },
  { src: "Debutant's Image (5).jpeg", out: "debutant-gallery-4.webp", width: 700 },
  { src: "Debutant's Image (7).jpeg", out: "debutant-gallery-5.webp", width: 700 },
  { src: "Debutant's Image (8).jpeg", out: "debutant-gallery-6.webp", width: 700 },
  { src: "Debutant's Image (9).jpeg", out: "debutant-gallery-7.webp", width: 700 },
  { src: "Dresscode.jpg", out: "dresscode-men.webp", width: 800 },
  { src: "dresscode2.png", out: "dresscode-women.webp", width: 1400 },
  { src: "Venue Image (1).JPG", out: "venue-1.webp", width: 1400 },
  { src: "Venue Image (2).JPG", out: "venue-2.webp", width: 1400 }
];

await mkdir(DIR, { recursive: true });

const results = [];
for (const job of JOBS) {
  const srcPath = path.join(DIR, job.src);
  const outPath = path.join(DIR, job.out);
  const image = sharp(srcPath).rotate();
  const resized = image.resize({ width: job.width, withoutEnlargement: true });
  const info = await resized.webp({ quality: 82 }).toFile(outPath);
  results.push({ out: job.out, width: info.width, height: info.height, aspect: +(info.width / info.height).toFixed(4) });
}

console.log(JSON.stringify(results, null, 2));
