import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2]);
const OUT = path.resolve(process.argv[3]);
const RES = Number(process.argv[4] || 80);
const RES_REPEATED = Number(process.argv[5] || RES);
const REPEATED_THRESHOLD = 5;

const text = fs.readFileSync(SRC, "utf8");

const blocks = [];
let current = null;

for (const line of text.split("\n")) {
  if (line.startsWith("o ") || line.startsWith("g ")) {
    current = { name: line.slice(2).trim(), verts: [], faceLines: [] };
    blocks.push(current);
  } else if (line.startsWith("v ")) {
    if (!current) {
      current = { name: "default", verts: [], faceLines: [] };
      blocks.push(current);
    }
    const [, x, y, z] = line.trim().split(/\s+/);
    current.verts.push([parseFloat(x), parseFloat(y), parseFloat(z)]);
  } else if (line.startsWith("f ")) {
    if (current) current.faceLines.push(line);
  }
}

const nameCounts = new Map();
for (const block of blocks) {
  nameCounts.set(block.name, (nameCounts.get(block.name) || 0) + 1);
}

function decimateBlock(block) {
  const res = nameCounts.get(block.name) > REPEATED_THRESHOLD ? RES_REPEATED : RES;
  const verts = block.verts;
  const tris = [];
  for (const line of block.faceLines) {
    const idx = line
      .trim()
      .split(/\s+/)
      .slice(1)
      .map((token) => parseInt(token.split("/")[0], 10) - 1 - blockVertexOffset(block));
    for (let i = 1; i < idx.length - 1; i += 1) {
      tris.push([idx[0], idx[i], idx[i + 1]]);
    }
  }

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

  const maxDimension = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
  const voxelSize = maxDimension / res;
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

  const outTris = [];
  const triSeen = new Set();
  for (const [a, b, c] of tris) {
    const ra = remap[a], rb = remap[b], rc = remap[c];
    if (ra === rb || rb === rc || ra === rc) continue;
    const sorted = [ra, rb, rc].sort((p, q) => p - q);
    const triKey = `${sorted[0]}_${sorted[1]}_${sorted[2]}`;
    if (triSeen.has(triKey)) continue;
    triSeen.add(triKey);
    outTris.push([ra, rb, rc]);
  }

  return { name: block.name, vertices: clusterSum, triangles: outTris, srcVerts: verts.length, srcTris: tris.length };
}

function blockVertexOffset(block) {
  return globalOffsets.get(block);
}

const globalOffsets = new Map();
let running = 0;
for (const block of blocks) {
  globalOffsets.set(block, running);
  running += block.verts.length;
}

const results = blocks.map(decimateBlock);

const grouped = new Map();
for (const r of results) {
  if (!grouped.has(r.name)) {
    grouped.set(r.name, { name: r.name, vertices: [], triangles: [], srcVerts: 0, srcTris: 0 });
  }
  const g = grouped.get(r.name);
  const base = g.vertices.length;
  for (const v of r.vertices) g.vertices.push(v);
  for (const [a, b, c] of r.triangles) g.triangles.push([a + base, b + base, c + base]);
  g.srcVerts += r.srcVerts;
  g.srcTris += r.srcTris;
}

let totalSrcV = 0, totalSrcT = 0, totalOutV = 0, totalOutT = 0;
const lines = [];
let outOffset = 0;
for (const g of grouped.values()) {
  lines.push(`o ${g.name}`);
  for (const v of g.vertices) {
    lines.push(`v ${(v.x / v.n).toFixed(5)} ${(v.y / v.n).toFixed(5)} ${(v.z / v.n).toFixed(5)}`);
  }
  for (const [a, b, c] of g.triangles) {
    lines.push(`f ${a + 1 + outOffset} ${b + 1 + outOffset} ${c + 1 + outOffset}`);
  }
  console.log(
    `${g.name}: ${g.srcVerts.toLocaleString()}v/${g.srcTris.toLocaleString()}t -> ${g.vertices.length.toLocaleString()}v/${g.triangles.length.toLocaleString()}t`
  );
  totalSrcV += g.srcVerts;
  totalSrcT += g.srcTris;
  totalOutV += g.vertices.length;
  totalOutT += g.triangles.length;
  outOffset += g.vertices.length;
}

console.log(`\nTotal: ${totalSrcV.toLocaleString()}v/${totalSrcT.toLocaleString()}t -> ${totalOutV.toLocaleString()}v/${totalOutT.toLocaleString()}t`);
console.log(`Reduction: ${(100 * (1 - totalOutT / totalSrcT)).toFixed(2)}%`);

fs.writeFileSync(OUT, lines.join("\n"));
const stat = fs.statSync(OUT);
console.log(`Wrote ${OUT} (${(stat.size / 1024).toFixed(1)} KB)`);
