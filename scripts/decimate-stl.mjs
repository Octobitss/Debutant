import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.argv[2]);
const OUT = path.resolve(process.argv[3]);
const RES = Number(process.argv[4] || 150);

console.log(`Reading ${SRC} ...`);
const buf = fs.readFileSync(SRC);
const headerSize = 80;
const triCount = buf.readUInt32LE(headerSize);
console.log(`Source triangles: ${triCount.toLocaleString()}`);
const dataStart = headerSize + 4;

let minX = Infinity, minY = Infinity, minZ = Infinity;
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
for (let i = 0; i < triCount; i += 1) {
  const triOffset = dataStart + i * 50;
  for (let v = 0; v < 3; v += 1) {
    const vOff = triOffset + 12 + v * 12;
    const x = buf.readFloatLE(vOff);
    const y = buf.readFloatLE(vOff + 4);
    const z = buf.readFloatLE(vOff + 8);
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  }
}
console.log("Bounds:", { minX, minY, minZ, maxX, maxY, maxZ });

const maxDimension = Math.max(maxX - minX, maxY - minY, maxZ - minZ);
const voxelSize = maxDimension / RES;
const invVoxel = 1 / voxelSize;
const rangeX = Math.ceil((maxX - minX) * invVoxel) + 2;
const rangeY = Math.ceil((maxY - minY) * invVoxel) + 2;

const vertexIndex = new Map();
const clusterSum = [];
const indices = [];
const triSeen = new Set();

function clusterKey(x, y, z) {
  const qx = Math.floor((x - minX) * invVoxel);
  const qy = Math.floor((y - minY) * invVoxel);
  const qz = Math.floor((z - minZ) * invVoxel);
  return qx + qy * rangeX + qz * rangeX * rangeY;
}

console.log("Clustering vertices ...");
const idx = [0, 0, 0];
for (let i = 0; i < triCount; i += 1) {
  const triOffset = dataStart + i * 50;
  for (let v = 0; v < 3; v += 1) {
    const vOff = triOffset + 12 + v * 12;
    const x = buf.readFloatLE(vOff);
    const y = buf.readFloatLE(vOff + 4);
    const z = buf.readFloatLE(vOff + 8);
    const key = clusterKey(x, y, z);
    let vi = vertexIndex.get(key);
    if (vi === undefined) {
      vi = clusterSum.length;
      vertexIndex.set(key, vi);
      clusterSum.push({ x, y, z, n: 1 });
    } else {
      const c = clusterSum[vi];
      c.x += x;
      c.y += y;
      c.z += z;
      c.n += 1;
    }
    idx[v] = vi;
  }

  if (idx[0] !== idx[1] && idx[1] !== idx[2] && idx[0] !== idx[2]) {
    const sorted = [...idx].sort((a, b) => a - b);
    const triKey = `${sorted[0]}_${sorted[1]}_${sorted[2]}`;
    if (!triSeen.has(triKey)) {
      triSeen.add(triKey);
      indices.push(idx[0], idx[1], idx[2]);
    }
  }
}

const vertCount = clusterSum.length;
const finalTriCount = indices.length / 3;
console.log(`Result: ${vertCount.toLocaleString()} vertices, ${finalTriCount.toLocaleString()} triangles`);
console.log(`Reduction: ${(100 * (1 - finalTriCount / triCount)).toFixed(2)}%`);

console.log("Writing OBJ ...");
const centerX = (minX + maxX) / 2;
const centerY = (minY + maxY) / 2;
const centerZ = (minZ + maxZ) / 2;

const lines = [];
for (let vi = 0; vi < vertCount; vi += 1) {
  const c = clusterSum[vi];
  const x = c.x / c.n - centerX;
  const y = c.y / c.n - centerY;
  const z = c.z / c.n - centerZ;
  lines.push(`v ${x.toFixed(5)} ${z.toFixed(5)} ${(-y).toFixed(5)}`);
}
for (let t = 0; t < indices.length; t += 3) {
  lines.push(`f ${indices[t] + 1} ${indices[t + 1] + 1} ${indices[t + 2] + 1}`);
}
fs.writeFileSync(OUT, lines.join("\n"));

const stat = fs.statSync(OUT);
console.log(`Wrote ${OUT} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
