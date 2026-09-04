import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2]);
const OUT = path.resolve(process.argv[3]);
const RES = Number(process.argv[4] || 80);

const text = fs.readFileSync(SRC, "utf8");
const verts = [];
const tris = [];

for (const line of text.split("\n")) {
  if (line.startsWith("v ")) {
    const [, x, y, z] = line.trim().split(/\s+/);
    verts.push([parseFloat(x), parseFloat(y), parseFloat(z)]);
  } else if (line.startsWith("f ")) {
    const idx = line
      .trim()
      .split(/\s+/)
      .slice(1)
      .map((token) => parseInt(token.split("/")[0], 10) - 1);
    for (let i = 1; i < idx.length - 1; i += 1) {
      tris.push([idx[0], idx[i], idx[i + 1]]);
    }
  }
}

console.log(`Source: ${verts.length.toLocaleString()} vertices, ${tris.length.toLocaleString()} triangles`);

let minX = Infinity, minY = Infinity, minZ = Infinity;
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
for (const [x, y, z] of verts) {
  if (x < minX) minX = x;
  if (x > maxX) maxX = x;
  if (y < minY) minY = y;
  if (y > maxY) maxY = y;
  if (z < minZ) minZ = z;
  if (z > maxZ) maxZ = z;
}

const maxDimension = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
const voxelSize = maxDimension / RES;
const invVoxel = 1 / voxelSize;
const rangeX = Math.ceil((maxX - minX) * invVoxel) + 2;
const rangeY = Math.ceil((maxY - minY) * invVoxel) + 2;

function clusterKey(x, y, z) {
  const qx = Math.floor((x - minX) * invVoxel);
  const qy = Math.floor((y - minY) * invVoxel);
  const qz = Math.floor((z - minZ) * invVoxel);
  return qx + qy * rangeX + qz * rangeX * rangeY;
}

const vertexIndex = new Map();
const clusterSum = [];
const outTris = [];
const triSeen = new Set();
const remap = new Int32Array(verts.length);

for (let vi = 0; vi < verts.length; vi += 1) {
  const [x, y, z] = verts[vi];
  const key = clusterKey(x, y, z);
  let ci = vertexIndex.get(key);
  if (ci === undefined) {
    ci = clusterSum.length;
    vertexIndex.set(key, ci);
    clusterSum.push({ x, y, z, n: 1 });
  } else {
    const c = clusterSum[ci];
    c.x += x;
    c.y += y;
    c.z += z;
    c.n += 1;
  }
  remap[vi] = ci;
}

for (const [a, b, c] of tris) {
  const ra = remap[a], rb = remap[b], rc = remap[c];
  if (ra === rb || rb === rc || ra === rc) continue;
  const sorted = [ra, rb, rc].sort((p, q) => p - q);
  const triKey = `${sorted[0]}_${sorted[1]}_${sorted[2]}`;
  if (triSeen.has(triKey)) continue;
  triSeen.add(triKey);
  outTris.push([ra, rb, rc]);
}

console.log(`Result: ${clusterSum.length.toLocaleString()} vertices, ${outTris.length.toLocaleString()} triangles`);
console.log(`Reduction: ${(100 * (1 - outTris.length / tris.length)).toFixed(2)}%`);

const lines = [];
for (const c of clusterSum) {
  lines.push(`v ${(c.x / c.n).toFixed(5)} ${(c.y / c.n).toFixed(5)} ${(c.z / c.n).toFixed(5)}`);
}
for (const [a, b, c] of outTris) {
  lines.push(`f ${a + 1} ${b + 1} ${c + 1}`);
}
fs.writeFileSync(OUT, lines.join("\n"));

const stat = fs.statSync(OUT);
console.log(`Wrote ${OUT} (${(stat.size / 1024).toFixed(1)} KB)`);
